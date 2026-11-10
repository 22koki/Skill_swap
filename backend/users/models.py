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

    def __str__(self):
        return f"{self.user.username}'s profile"
