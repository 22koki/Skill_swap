from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("users", "0002_profile_reputation"),
    ]

    operations = [
        migrations.CreateModel(
            name="AvailabilitySlot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("weekday", models.PositiveSmallIntegerField()),
                ("start_time", models.TimeField()),
                ("end_time", models.TimeField()),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="availability_slots", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["weekday", "start_time"]},
        ),
        migrations.AddConstraint(
            model_name="availabilityslot",
            constraint=models.UniqueConstraint(fields=("user", "weekday", "start_time", "end_time"), name="unique_user_availability_slot"),
        ),
    ]
