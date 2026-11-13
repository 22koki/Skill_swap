from datetime import timedelta

from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification, NotificationPreference

def _broadcast_notification(notification):
    if not notification:
        return
    from .serializers import NotificationSerializer

    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)(
        f"user_{notification.user_id}",
        {
            "type": "notification_event",
            "notification": NotificationSerializer(notification).data,
        },
    )


PREFERENCE_FIELDS = {
    Notification.Kind.SWAP: "swaps",
    Notification.Kind.MESSAGE: "messages",
    Notification.Kind.SESSION: "sessions",
    Notification.Kind.REVIEW: "reviews",
    Notification.Kind.PROGRESS: "progress",
    Notification.Kind.MATCH: "matches",
}


def _enabled(user, kind):
    preferences, _ = NotificationPreference.objects.get_or_create(user=user)
    field = PREFERENCE_FIELDS.get(kind)
    return True if not field else getattr(preferences, field, True)


def notify(user, kind, title, body="", actor=None, action_type="", target_id=None, dedupe_key="", metadata=None):
    if not _enabled(user, kind):
        return None

    if dedupe_key:
        existing = Notification.objects.filter(user=user, dedupe_key=dedupe_key).first()
        if existing:
            return existing

    notification = Notification.objects.create(
        user=user,
        actor=actor,
        kind=kind,
        title=title,
        body=body,
        action_type=action_type,
        target_id=target_id,
        dedupe_key=dedupe_key,
        metadata=metadata or {},
    )
    _broadcast_notification(notification)
    return notification


def sync_session_reminders(user):
    from bookings.models import Booking
    from django.db.models import Q

    now = timezone.now()
    soon = now + timedelta(hours=24)
    bookings = Booking.objects.filter(
        Q(swap__requester=user) | Q(swap__recipient=user),
        status=Booking.Status.SCHEDULED,
        starts_at__gt=now,
        starts_at__lte=soon,
    ).select_related("swap__requester", "swap__recipient")

    for booking in bookings:
        partner = booking.swap.recipient if booking.swap.requester_id == user.id else booking.swap.requester
        local_start = timezone.localtime(booking.starts_at)
        notify(
            user,
            Notification.Kind.SESSION,
            "Your SkillSwap is coming up",
            f"{partner.get_full_name() or partner.username} · {local_start.strftime('%a %H:%M')}",
            actor=partner,
            action_type="booking",
            target_id=booking.id,
            dedupe_key=f"booking-reminder:{booking.id}",
            metadata={"starts_at": booking.starts_at.isoformat()},
        )


def sync_progress_notifications(user):
    from users.progression import build_progression

    progression = build_progression(user)
    for achievement in progression.get("unlocked", []):
        notify(
            user,
            Notification.Kind.PROGRESS,
            f"Achievement unlocked · {achievement['title']}",
            f"+{achievement['xp']} XP · {achievement['description']}",
            action_type="progression",
            target_id=user.id,
            dedupe_key=f"achievement:{achievement['key']}",
            metadata={"achievement": achievement},
        )
