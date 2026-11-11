from django.conf import settings
from django.db import models
from bookings.models import Booking

class Review(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews_written")
    reviewee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews_received")
    overall_rating = models.PositiveSmallIntegerField()
    teaching_quality = models.PositiveSmallIntegerField()
    communication = models.PositiveSmallIntegerField()
    reliability = models.PositiveSmallIntegerField()
    friendliness = models.PositiveSmallIntegerField()
    would_swap_again = models.BooleanField(default=True)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["booking", "reviewer"], name="one_review_per_booking_reviewer"),
        ]

    def __str__(self):
        return f"{self.reviewer} → {self.reviewee} ({self.overall_rating}/5)"
