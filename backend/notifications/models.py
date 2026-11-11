from django.conf import settings
from django.db import models

class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_preferences")
    swaps = models.BooleanField(default=True)
    messages = models.BooleanField(default=True)
    sessions = models.BooleanField(default=True)
    reviews = models.BooleanField(default=True)
    progress = models.BooleanField(default=True)
    matches = models.BooleanField(default=True)

    def __str__(self):
        return f"Notification preferences · {self.user.username}"


class Notification(models.Model):
    class Kind(models.TextChoices):
        SWAP = "swap", "Swap"
        MESSAGE = "message", "Message"
        SESSION = "session", "Session"
        REVIEW = "review", "Review"
        PROGRESS = "progress", "Progress"
        MATCH = "match", "Match"
        SYSTEM = "system", "System"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="skillswap_notifications")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="skillswap_notifications_created",
    )
    kind = models.CharField(max_length=16, choices=Kind.choices)
    title = models.CharField(max_length=160)
    body = models.CharField(max_length=320, blank=True)
    action_type = models.CharField(max_length=24, blank=True)
    target_id = models.PositiveIntegerField(null=True, blank=True)
    dedupe_key = models.CharField(max_length=120, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} · {self.title}"
