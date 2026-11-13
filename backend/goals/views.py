from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LearningGoal, Milestone
from .serializers import GoalSerializer, MilestoneWriteSerializer


class GoalListView(generics.ListCreateAPIView):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LearningGoal.objects.filter(owner=self.request.user).select_related("skill").prefetch_related("milestones")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return LearningGoal.objects.filter(owner=self.request.user).select_related("skill").prefetch_related("milestones")


class MilestoneListView(generics.ListCreateAPIView):
    serializer_class = MilestoneWriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Milestone.objects.filter(goal__owner=self.request.user, goal_id=self.kwargs["goal_id"])

    def perform_create(self, serializer):
        goal = generics.get_object_or_404(
            LearningGoal, pk=self.kwargs["goal_id"], owner=self.request.user
        )
        completed = serializer.validated_data.get("is_done", False)
        serializer.save(goal=goal, completed_at=timezone.now() if completed else None)


class MilestoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MilestoneWriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Milestone.objects.filter(goal__owner=self.request.user, goal_id=self.kwargs["goal_id"])

    def perform_update(self, serializer):
        previous_done = serializer.instance.is_done
        completed = serializer.validated_data.get("is_done", previous_done)
        if completed and not previous_done:
            # Preserve the original completion time when editing a completed step.
            serializer.save(completed_at=timezone.now())
        elif not completed:
            # Undoing a step must remove its streak/challenge contribution.
            serializer.save(completed_at=None)
        else:
            serializer.save()
