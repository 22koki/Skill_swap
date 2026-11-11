from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking
from .models import SessionWorkspace, WorkspaceResource, WorkspaceChecklistItem
from .ai_planner import generate_learning_plan, checklist_items_from_plan
from .serializers import (
    SessionWorkspaceSerializer,
    WorkspaceResourceSerializer,
    WorkspaceChecklistItemSerializer,
)

def booking_for_user(request, booking_id):
    booking = get_object_or_404(
        Booking.objects.select_related(
            "swap", "swap__requester", "swap__recipient",
            "swap__offered_skill", "swap__requested_skill",
        ),
        pk=booking_id,
    )
    if request.user not in {booking.swap.requester, booking.swap.recipient}:
        return None
    return booking

class WorkspaceDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        booking = booking_for_user(request, booking_id)
        if not booking:
            return Response({"detail": "You are not part of this booking."}, status=403)
        if booking.status == Booking.Status.CANCELLED:
            return Response({"detail": "Cancelled bookings do not have an active workspace."}, status=400)

        workspace, _ = SessionWorkspace.objects.get_or_create(booking=booking)
        return Response(SessionWorkspaceSerializer(workspace, context={"request": request}).data)

    def patch(self, request, booking_id):
        booking = booking_for_user(request, booking_id)
        if not booking:
            return Response({"detail": "You are not part of this booking."}, status=403)
        if booking.status == Booking.Status.CANCELLED:
            return Response({"detail": "Cancelled bookings cannot be edited."}, status=400)

        workspace, _ = SessionWorkspace.objects.get_or_create(booking=booking)
        serializer = SessionWorkspaceSerializer(
            workspace,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class ResourceCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = booking_for_user(request, booking_id)
        if not booking:
            return Response({"detail": "You are not part of this booking."}, status=403)
        workspace, _ = SessionWorkspace.objects.get_or_create(booking=booking)
        serializer = WorkspaceResourceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resource = serializer.save(workspace=workspace, added_by=request.user)
        return Response(WorkspaceResourceSerializer(resource).data, status=status.HTTP_201_CREATED)

class ResourceDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        resource = get_object_or_404(
            WorkspaceResource.objects.select_related(
                "workspace__booking__swap__requester",
                "workspace__booking__swap__recipient",
            ),
            pk=pk,
        )
        swap = resource.workspace.booking.swap
        if request.user not in {swap.requester, swap.recipient}:
            return Response({"detail": "You are not part of this workspace."}, status=403)
        resource.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ChecklistCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = booking_for_user(request, booking_id)
        if not booking:
            return Response({"detail": "You are not part of this booking."}, status=403)
        workspace, _ = SessionWorkspace.objects.get_or_create(booking=booking)
        serializer = WorkspaceChecklistItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(workspace=workspace, created_by=request.user)
        return Response(WorkspaceChecklistItemSerializer(item).data, status=status.HTTP_201_CREATED)

class ChecklistDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_item(self, request, pk):
        item = get_object_or_404(
            WorkspaceChecklistItem.objects.select_related(
                "workspace__booking__swap__requester",
                "workspace__booking__swap__recipient",
            ),
            pk=pk,
        )
        swap = item.workspace.booking.swap
        if request.user not in {swap.requester, swap.recipient}:
            return None
        return item

    def patch(self, request, pk):
        item = self._get_item(request, pk)
        if not item:
            return Response({"detail": "You are not part of this workspace."}, status=403)

        if "text" in request.data:
            text = str(request.data.get("text", "")).strip()
            if not text:
                return Response({"detail": "Checklist item cannot be empty."}, status=400)
            item.text = text

        if "is_done" in request.data:
            is_done = bool(request.data.get("is_done"))
            item.is_done = is_done
            item.completed_by = request.user if is_done else None
            item.completed_at = timezone.now() if is_done else None

        item.save()
        return Response(WorkspaceChecklistItemSerializer(item).data)

    def delete(self, request, pk):
        item = self._get_item(request, pk)
        if not item:
            return Response({"detail": "You are not part of this workspace."}, status=403)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AIPlanGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = booking_for_user(request, booking_id)
        if not booking:
            return Response({"detail": "You are not part of this booking."}, status=403)
        if booking.status == Booking.Status.CANCELLED:
            return Response({"detail": "Cancelled bookings cannot generate a learning plan."}, status=400)

        workspace, _ = SessionWorkspace.objects.get_or_create(booking=booking)

        learner_level = str(request.data.get("learner_level", "beginner")).strip().lower()
        if learner_level not in {"beginner", "intermediate", "advanced", "expert"}:
            learner_level = "beginner"

        learning_style = str(request.data.get("learning_style", "step_by_step")).strip().lower()
        if learning_style not in {"practical", "theory_first", "project_based", "fast_paced", "step_by_step"}:
            learning_style = "step_by_step"

        try:
            session_count = max(1, min(int(request.data.get("session_count", 3)), 6))
        except (TypeError, ValueError):
            session_count = 3

        goal = str(request.data.get("goal", "")).strip()[:500]
        duration = booking.duration_minutes or 60
        swap = booking.swap

        if swap.requester == request.user:
            learn_skill = swap.requested_skill.name
            partner = swap.recipient
        else:
            learn_skill = swap.offered_skill.name
            partner = swap.requester

        partner_name = partner.get_full_name() or partner.username
        plan, source = generate_learning_plan(
            skill=learn_skill,
            goal=goal,
            learner_level=learner_level,
            learning_style=learning_style,
            session_count=session_count,
            duration_minutes=duration,
            partner_context=f"Peer learning with {partner_name}",
        )

        workspace.ai_plan = plan
        workspace.ai_plan_source = source
        workspace.ai_goal = goal or plan.get("goal", "")
        workspace.ai_learner_level = learner_level
        workspace.ai_learning_style = learning_style
        workspace.ai_session_count = session_count
        workspace.ai_plan_updated_at = timezone.now()
        workspace.save(update_fields=[
            "ai_plan", "ai_plan_source", "ai_goal", "ai_learner_level",
            "ai_learning_style", "ai_session_count", "ai_plan_updated_at", "updated_at",
        ])

        return Response(SessionWorkspaceSerializer(workspace, context={"request": request}).data)


class AIPlanChecklistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = booking_for_user(request, booking_id)
        if not booking:
            return Response({"detail": "You are not part of this booking."}, status=403)

        workspace, _ = SessionWorkspace.objects.get_or_create(booking=booking)
        if not workspace.ai_plan:
            return Response({"detail": "Generate an AI learning plan first."}, status=400)

        created = []
        existing = set(workspace.checklist.values_list("text", flat=True))
        for text in checklist_items_from_plan(workspace.ai_plan):
            if text in existing:
                continue
            item = WorkspaceChecklistItem.objects.create(
                workspace=workspace,
                text=text[:220],
                created_by=request.user,
            )
            created.append(item)
            existing.add(text)

        return Response({
            "created": WorkspaceChecklistItemSerializer(created, many=True).data,
            "workspace": SessionWorkspaceSerializer(workspace, context={"request": request}).data,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
