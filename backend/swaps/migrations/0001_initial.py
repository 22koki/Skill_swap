from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("skills", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Swap",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("message", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("proposed","Proposed"),("accepted","Accepted"),("declined","Declined"),("cancelled","Cancelled"),("completed","Completed")], default="proposed", max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("offered_skill", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="offered_swaps", to="skills.skill")),
                ("recipient", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="received_swaps", to=settings.AUTH_USER_MODEL)),
                ("requested_skill", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="requested_swaps", to="skills.skill")),
                ("requester", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sent_swaps", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering":["-created_at"]},
        ),
    ]
