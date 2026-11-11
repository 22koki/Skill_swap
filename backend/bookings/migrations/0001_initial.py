from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("swaps", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Booking",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("starts_at", models.DateTimeField()),
                ("duration_minutes", models.PositiveIntegerField(default=60)),
                ("mode", models.CharField(choices=[("online","Online"),("in_person","In person")], default="online", max_length=16)),
                ("meeting_link", models.URLField(blank=True)),
                ("location_note", models.CharField(blank=True, max_length=255)),
                ("note", models.CharField(blank=True, max_length=255)),
                ("status", models.CharField(choices=[("scheduled","Scheduled"),("cancelled","Cancelled"),("completed","Completed")], default="scheduled", max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("swap", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="bookings", to="swaps.swap")),
            ],
            options={"ordering":["starts_at"]},
        ),
    ]
