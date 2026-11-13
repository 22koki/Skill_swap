from django.urls import path

from .views import (
    CircleListCreateView,
    CircleDetailView,
    CircleJoinView,
    CircleLeaveView,
    CircleMessagesView,
    CircleSessionsView,
    CircleTasksView,
    CircleTaskDetailView,
    CircleResourcesView,
    CircleAIPlanView,
    CircleMemberModerationView,
    CircleMessageModerationView,
)

urlpatterns = [
    path("", CircleListCreateView.as_view(), name="circle-list-create"),
    path("<int:circle_id>/", CircleDetailView.as_view(), name="circle-detail"),
    path("<int:circle_id>/join/", CircleJoinView.as_view(), name="circle-join"),
    path("<int:circle_id>/leave/", CircleLeaveView.as_view(), name="circle-leave"),
    path("<int:circle_id>/messages/", CircleMessagesView.as_view(), name="circle-messages"),
    path("<int:circle_id>/messages/<int:pk>/", CircleMessageModerationView.as_view(), name="circle-message-moderation"),
    path("<int:circle_id>/members/<int:user_id>/<str:action>/", CircleMemberModerationView.as_view(), name="circle-member-moderation"),
    path("<int:circle_id>/sessions/", CircleSessionsView.as_view(), name="circle-sessions"),
    path("<int:circle_id>/tasks/", CircleTasksView.as_view(), name="circle-tasks"),
    path("tasks/<int:pk>/", CircleTaskDetailView.as_view(), name="circle-task-detail"),
    path("<int:circle_id>/resources/", CircleResourcesView.as_view(), name="circle-resources"),
    path("<int:circle_id>/ai-plan/", CircleAIPlanView.as_view(), name="circle-ai-plan"),
]
