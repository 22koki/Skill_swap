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
