from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking
from .models import SessionWorkspace, WorkspaceResource, WorkspaceChecklistItem
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
