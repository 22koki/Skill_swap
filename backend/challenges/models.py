from django.conf import settings
from django.db import models


class ChallengeEnrollment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="challenge_enrollments")
    slug = models.SlugField(max_length=64)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-joined_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "slug"], name="unique_challenge_enrollment")
        ]
