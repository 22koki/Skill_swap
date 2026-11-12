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
        goal = generics.get_object_or_404(LearningGoal, pk=self.kwargs["goal_id"], owner=self.request.user)
        serializer.save(goal=goal)


class MilestoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MilestoneWriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Milestone.objects.filter(goal__owner=self.request.user, goal_id=self.kwargs["goal_id"])

    def perform_update(self, serializer):
        milestone = serializer.save()
        milestone.completed_at = timezone.now() if milestone.is_done else None
        milestone.save(update_fields=["completed_at"])
