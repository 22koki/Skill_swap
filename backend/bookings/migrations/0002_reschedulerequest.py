from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="RescheduleRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("proposed_starts_at", models.DateTimeField()),
                ("proposed_duration_minutes", models.PositiveIntegerField(default=60)),
                ("proposed_mode", models.CharField(choices=[("online", "Online"), ("in_person", "In person")], default="online", max_length=16)),
                ("proposed_meeting_link", models.URLField(blank=True)),
                ("proposed_location_note", models.CharField(blank=True, max_length=255)),
                ("note", models.CharField(blank=True, max_length=255)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("accepted", "Accepted"), ("declined", "Declined"), ("cancelled", "Cancelled")], default="pending", max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("booking", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reschedule_requests", to="bookings.booking")),
                ("requested_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="booking_reschedule_requests", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
