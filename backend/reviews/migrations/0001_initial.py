from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("bookings", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Review",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("overall_rating", models.PositiveSmallIntegerField()),
                ("teaching_quality", models.PositiveSmallIntegerField()),
                ("communication", models.PositiveSmallIntegerField()),
                ("reliability", models.PositiveSmallIntegerField()),
                ("friendliness", models.PositiveSmallIntegerField()),
                ("would_swap_again", models.BooleanField(default=True)),
                ("comment", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("booking", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to="bookings.booking")),
                ("reviewee", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews_received", to=settings.AUTH_USER_MODEL)),
                ("reviewer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews_written", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering":["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="review",
            constraint=models.UniqueConstraint(fields=("booking","reviewer"), name="one_review_per_booking_reviewer"),
        ),
    ]
