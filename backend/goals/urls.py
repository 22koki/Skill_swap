from django.urls import path
from .views import GoalListView, GoalDetailView, MilestoneListView, MilestoneDetailView

urlpatterns = [
    path("", GoalListView.as_view(), name="goals-list"),
    path("<int:pk>/", GoalDetailView.as_view(), name="goals-detail"),
    path("<int:goal_id>/milestones/", MilestoneListView.as_view(), name="goal-milestones"),
    path("<int:goal_id>/milestones/<int:pk>/", MilestoneDetailView.as_view(), name="goal-milestone-detail"),
]
