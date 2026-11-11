from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import Notification
from notifications.services import notify
from workspaces.ai_planner import generate_learning_plan

from .models import SkillCircle, CircleMember, CircleMessage, CircleSession, CircleTask, CircleResource
from .serializers import (
    SkillCircleSerializer,
    CircleMessageSerializer,
    CircleSessionSerializer,
    CircleTaskSerializer,
    CircleResourceSerializer,
)


def circle_for_user(request, circle_id, require_member=False):
    circle = get_object_or_404(
        SkillCircle.objects.select_related("primary_skill", "primary_skill__category", "created_by"),
        pk=circle_id,
    )
    if not circle.is_public and not request.user.is_authenticated:
        return None
    if require_member:
        if not request.user.is_authenticated or not circle.memberships.filter(user=request.user).exists():
            return None
    return circle


def is_mentor(circle, user):
    return circle.created_by_id == user.id or circle.memberships.filter(
        user=user, role=CircleMember.Role.MENTOR
    ).exists()


class CircleListCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        circles = SkillCircle.objects.select_related(
            "primary_skill", "primary_skill__category", "created_by"
        ).prefetch_related("memberships__user", "sessions", "tasks", "resources").all()
        if not request.user.is_authenticated:
            circles = circles.filter(is_public=True)
        return Response(SkillCircleSerializer(circles, many=True, context={"request": request}).data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Log in to create a Skill Circle."}, status=401)
        serializer = SkillCircleSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        circle = serializer.save(created_by=request.user)
        CircleMember.objects.create(circle=circle, user=request.user, role=CircleMember.Role.MENTOR)
        return Response(
            SkillCircleSerializer(circle, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class CircleDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, circle_id):
        circle = circle_for_user(request, circle_id)
        if not circle:
            return Response({"detail": "This circle is private."}, status=403)
        return Response(SkillCircleSerializer(circle, context={"request": request}).data)

    def patch(self, request, circle_id):
        circle = circle_for_user(request, circle_id, require_member=True)
        if not circle:
            return Response({"detail": "Join this circle first."}, status=403)
        if not is_mentor(circle, request.user):
            return Response({"detail": "Only mentors can edit circle details."}, status=403)
        serializer = SkillCircleSerializer(circle, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class CircleJoinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, circle_id):
        circle = circle_for_user(request, circle_id)
        role = str(request.data.get("role", CircleMember.Role.LEARNER))
        if role not in {CircleMember.Role.MENTOR, CircleMember.Role.LEARNER}:
            role = CircleMember.Role.LEARNER
        membership, created = CircleMember.objects.get_or_create(
            circle=circle,
            user=request.user,
            defaults={"role": role},
        )
        if not created and membership.role != role:
            membership.role = role
            membership.save(update_fields=["role"])
        if created and circle.created_by_id != request.user.id:
            notify(
                circle.created_by,
                Notification.Kind.SYSTEM,
                f"{request.user.get_full_name() or request.user.username} joined {circle.title}",
                f"Joined as {membership.get_role_display()}.",
                actor=request.user,
                action_type="circle",
                target_id=circle.id,
                dedupe_key=f"circle-join:{circle.id}:{request.user.id}",
            )
        return Response(SkillCircleSerializer(circle, context={"request": request}).data)


class CircleLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, circle_id):
        circle = circle_for_user(request, circle_id)
        if circle.created_by_id == request.user.id:
            return Response({"detail": "Circle creators cannot leave their own circle."}, status=400)
        circle.memberships.filter(user=request.user).delete()
        return Response(SkillCircleSerializer(circle, context={"request": request}).data)


class CircleMessagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, circle_id):
        circle = circle_for_user(request, circle_id, require_member=True)
        if not circle:
            return Response({"detail": "Join this circle to view chat."}, status=403)
        messages = circle.messages.select_related("sender", "sender__profile").all()
        return Response(CircleMessageSerializer(messages, many=True).data)

    def post(self, request, circle_id):
        circle = circle_for_user(request, circle_id, require_member=True)
        if not circle:
            return Response({"detail": "Join this circle to chat."}, status=403)
        body = str(request.data.get("body", "")).strip()
        if not body:
            return Response({"detail": "Message cannot be empty."}, status=400)
        message = CircleMessage.objects.create(circle=circle, sender=request.user, body=body[:3000])
        payload = CircleMessageSerializer(message).data
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"circle_{circle.id}",
                {"type": "circle_message_event", "message": payload},
            )
        return Response(payload, status=status.HTTP_201_CREATED)


class CircleSessionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, circle_id):
        circle = circle_for_user(request, circle_id, require_member=True)
        if not circle:
            return Response({"detail": "Join this circle first."}, status=403)
        if not is_mentor(circle, request.user):
            return Response({"detail": "Only mentors can schedule group sessions."}, status=403)
        serializer = CircleSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save(circle=circle, created_by=request.user)
        return Response(CircleSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class CircleTasksView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, circle_id):
        circle = circle_for_user(request, circle_id, require_member=True)
        if not circle:
            return Response({"detail": "Join this circle first."}, status=403)
        text = str(request.data.get("text", "")).strip()
        if not text:
            return Response({"detail": "Challenge cannot be empty."}, status=400)
        task = CircleTask.objects.create(circle=circle, text=text[:240], created_by=request.user)
        return Response(CircleTaskSerializer(task).data, status=status.HTTP_201_CREATED)


class CircleTaskDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        task = get_object_or_404(CircleTask.objects.select_related("circle"), pk=pk)
        if not task.circle.memberships.filter(user=request.user).exists():
            return Response({"detail": "Join this circle first."}, status=403)
        if "is_done" in request.data:
            done = bool(request.data.get("is_done"))
            task.is_done = done
            task.completed_by = request.user if done else None
            task.completed_at = timezone.now() if done else None
        if "text" in request.data:
            text = str(request.data.get("text", "")).strip()
            if text:
                task.text = text[:240]
        task.save()
        return Response(CircleTaskSerializer(task).data)


class CircleResourcesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, circle_id):
        circle = circle_for_user(request, circle_id, require_member=True)
        if not circle:
            return Response({"detail": "Join this circle first."}, status=403)
        serializer = CircleResourceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resource = serializer.save(circle=circle, added_by=request.user)
        return Response(CircleResourceSerializer(resource).data, status=status.HTTP_201_CREATED)


class CircleAIPlanView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, circle_id):
        circle = circle_for_user(request, circle_id, require_member=True)
        if not circle:
            return Response({"detail": "Join this circle first."}, status=403)
        if not is_mentor(circle, request.user):
            return Response({"detail": "Only mentors can generate the shared roadmap."}, status=403)

        try:
            session_count = max(2, min(int(request.data.get("session_count", 4)), 6))
        except (TypeError, ValueError):
            session_count = 4

        skill_name = circle.primary_skill.name if circle.primary_skill else circle.title
        goal = str(request.data.get("goal", circle.goal or circle.description)).strip()[:500]
        plan, source = generate_learning_plan(
            skill=skill_name,
            goal=goal,
            learner_level=str(request.data.get("learner_level", "beginner")),
            learning_style=str(request.data.get("learning_style", "project_based")),
            session_count=session_count,
            duration_minutes=max(45, min(int(request.data.get("duration_minutes", 60)), 180)),
            partner_context=f"Group learning circle with {circle.memberships.count()} members and mixed mentor/learner roles.",
        )
        circle.ai_plan = plan
        circle.ai_plan_source = source
        circle.ai_plan_updated_at = timezone.now()
        circle.save(update_fields=["ai_plan", "ai_plan_source", "ai_plan_updated_at", "updated_at"])

        return Response(SkillCircleSerializer(circle, context={"request": request}).data)
