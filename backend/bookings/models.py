from django.db import models
from swaps.models import Swap

class Booking(models.Model):
    class Mode(models.TextChoices):
        ONLINE = "online", "Online"
        IN_PERSON = "in_person", "In person"

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    swap = models.ForeignKey(Swap, on_delete=models.CASCADE, related_name="bookings")
    starts_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    mode = models.CharField(max_length=16, choices=Mode.choices, default=Mode.ONLINE)
    meeting_link = models.URLField(blank=True)
    location_note = models.CharField(max_length=255, blank=True)
    note = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.SCHEDULED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["starts_at"]

    def __str__(self):
        return f"{self.swap} @ {self.starts_at}"
