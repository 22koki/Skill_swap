from django.urls import path
from .views import (
    WorkspaceDetailView,
    ResourceCreateView,
    ResourceDetailView,
    ChecklistCreateView,
    ChecklistDetailView,
)

urlpatterns = [
    path("bookings/<int:booking_id>/", WorkspaceDetailView.as_view(), name="workspace-detail"),
    path("bookings/<int:booking_id>/resources/", ResourceCreateView.as_view(), name="workspace-resource-create"),
    path("resources/<int:pk>/", ResourceDetailView.as_view(), name="workspace-resource-detail"),
    path("bookings/<int:booking_id>/checklist/", ChecklistCreateView.as_view(), name="workspace-checklist-create"),
    path("checklist/<int:pk>/", ChecklistDetailView.as_view(), name="workspace-checklist-detail"),
]
