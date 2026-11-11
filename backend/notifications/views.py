from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer
from .services import sync_session_reminders, sync_progress_notifications

class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sync_session_reminders(request.user)
        sync_progress_notifications(request.user)

        queryset = Notification.objects.filter(user=request.user).select_related("actor", "actor__profile")
        kind = request.query_params.get("kind", "").strip()
        if kind:
            queryset = queryset.filter(kind=kind)

        notifications = queryset[:80]
        unread_count = Notification.objects.filter(user=request.user, read_at__isnull=True).count()
        return Response({
            "unread_count": unread_count,
            "notifications": NotificationSerializer(notifications, many=True).data,
        })


class NotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        notification = Notification.objects.filter(user=request.user, pk=pk).first()
        if not notification:
            return Response({"detail": "Notification not found."}, status=404)
        if not notification.read_at:
            notification.read_at = timezone.now()
            notification.save(update_fields=["read_at"])
        return Response(NotificationSerializer(notification).data)


class NotificationReadAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, read_at__isnull=True).update(read_at=timezone.now())
        return Response({"detail": "All notifications marked as read."})


class NotificationPreferencesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        preferences, _ = NotificationPreference.objects.get_or_create(user=request.user)
        return Response(NotificationPreferenceSerializer(preferences).data)

    def patch(self, request):
        preferences, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(preferences, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
