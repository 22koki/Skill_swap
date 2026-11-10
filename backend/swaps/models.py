from django.conf import settings
from django.db import models
from skills.models import Skill

class Swap(models.Model):
    class Status(models.TextChoices):
        PROPOSED = "proposed", "Proposed"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_swaps")
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_swaps")
    offered_skill = models.ForeignKey(Skill, on_delete=models.PROTECT, related_name="offered_swaps")
    requested_skill = models.ForeignKey(Skill, on_delete=models.PROTECT, related_name="requested_swaps")
    message = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PROPOSED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.requester} → {self.recipient}: {self.offered_skill} ↔ {self.requested_skill}"
