from django.conf import settings
from django.db import models

class Profile(models.Model):
    class SessionPreference(models.TextChoices):
        ONLINE = "online", "Online"
        IN_PERSON = "in_person", "In person"
        BOTH = "both", "Both"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=120, blank=True)
    avatar_url = models.URLField(blank=True)
    session_preference = models.CharField(
        max_length=20,
        choices=SessionPreference.choices,
        default=SessionPreference.BOTH,
    )
    availability_note = models.CharField(max_length=255, blank=True)
    completed_swaps = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    teaching_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    communication_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    reliability_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    friendliness_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    would_swap_again_percent = models.PositiveSmallIntegerField(default=0)

    def __str__(self):
        return f"{self.user.username}'s profile"


class AvailabilitySlot(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="availability_slots")
    weekday = models.PositiveSmallIntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        ordering = ["weekday", "start_time"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "weekday", "start_time", "end_time"],
                name="unique_user_availability_slot",
            )
        ]

    def __str__(self):
        return f"{self.user.username} · {self.weekday} · {self.start_time}-{self.end_time}"



class UserBlock(models.Model):
    blocker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blocks_created",
    )
    blocked = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blocks_received",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["blocker", "blocked"], name="unique_user_block")
        ]

    def __str__(self):
        return f"{self.blocker} blocked {self.blocked}"


class AccountStanding(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="account_standing",
    )
    warning_count = models.PositiveIntegerField(default=0)
    restricted_until = models.DateTimeField(null=True, blank=True)
    suspended = models.BooleanField(default=False)
    note = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} · {'suspended' if self.suspended else 'active'}"


class SafetyReport(models.Model):
    class TargetType(models.TextChoices):
        USER = "user", "User"
        MESSAGE = "message", "Message"
        CIRCLE = "circle", "Circle"
        CIRCLE_MESSAGE = "circle_message", "Circle message"

    class Reason(models.TextChoices):
        HARASSMENT = "harassment", "Harassment"
        SPAM = "spam", "Spam"
        SCAM = "scam", "Scam or fraud"
        INAPPROPRIATE = "inappropriate", "Inappropriate behaviour"
        FAKE_PROFILE = "fake_profile", "Fake profile"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REVIEWING = "reviewing", "Reviewing"
        RESOLVED = "resolved", "Resolved"
        DISMISSED = "dismissed", "Dismissed"

    class ResolutionAction(models.TextChoices):
        NONE = "none", "None"
        WARN = "warn", "Warn"
        RESTRICT = "restrict", "Restrict"
        SUSPEND = "suspend", "Suspend"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="safety_reports_made",
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="safety_reports_received",
    )
    target_type = models.CharField(max_length=24, choices=TargetType.choices)
    target_id = models.PositiveIntegerField(null=True, blank=True)
    reason = models.CharField(max_length=24, choices=Reason.choices)
    details = models.TextField(blank=True)
    evidence = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    resolution_action = models.CharField(
        max_length=16,
        choices=ResolutionAction.choices,
        default=ResolutionAction.NONE,
    )
    resolution_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="safety_reports_reviewed",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report #{self.id} · {self.target_type} · {self.reason}"
