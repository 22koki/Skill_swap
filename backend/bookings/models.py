from django.conf import settings
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


class RescheduleRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        CANCELLED = "cancelled", "Cancelled"

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="reschedule_requests")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="booking_reschedule_requests",
    )
    proposed_starts_at = models.DateTimeField()
    proposed_duration_minutes = models.PositiveIntegerField(default=60)
    proposed_mode = models.CharField(max_length=16, choices=Booking.Mode.choices, default=Booking.Mode.ONLINE)
    proposed_meeting_link = models.URLField(blank=True)
    proposed_location_note = models.CharField(max_length=255, blank=True)
    note = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Reschedule #{self.id} · booking #{self.booking_id} · {self.status}"
