from django.urls import path
from .views import (
    WorkspaceDetailView,
    ResourceCreateView,
    ResourceDetailView,
    ChecklistCreateView,
    ChecklistDetailView,
    AIPlanGenerateView,
    AIPlanChecklistView,
    SessionRecapGenerateView,
    SessionRecapChecklistView,
)

urlpatterns = [
    path("bookings/<int:booking_id>/", WorkspaceDetailView.as_view(), name="workspace-detail"),
    path("bookings/<int:booking_id>/ai-plan/generate/", AIPlanGenerateView.as_view(), name="workspace-ai-plan-generate"),
    path("bookings/<int:booking_id>/ai-plan/checklist/", AIPlanChecklistView.as_view(), name="workspace-ai-plan-checklist"),
    path("bookings/<int:booking_id>/recap/generate/", SessionRecapGenerateView.as_view(), name="workspace-recap-generate"),
    path("bookings/<int:booking_id>/recap/checklist/", SessionRecapChecklistView.as_view(), name="workspace-recap-checklist"),
    path("bookings/<int:booking_id>/resources/", ResourceCreateView.as_view(), name="workspace-resource-create"),
    path("resources/<int:pk>/", ResourceDetailView.as_view(), name="workspace-resource-detail"),
    path("bookings/<int:booking_id>/checklist/", ChecklistCreateView.as_view(), name="workspace-checklist-create"),
    path("checklist/<int:pk>/", ChecklistDetailView.as_view(), name="workspace-checklist-detail"),
]
