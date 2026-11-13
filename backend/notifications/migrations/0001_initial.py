from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="NotificationPreference",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("swaps", models.BooleanField(default=True)),
                ("messages", models.BooleanField(default=True)),
                ("sessions", models.BooleanField(default=True)),
                ("reviews", models.BooleanField(default=True)),
                ("progress", models.BooleanField(default=True)),
                ("matches", models.BooleanField(default=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="notification_preferences", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("kind", models.CharField(choices=[("swap", "Swap"), ("message", "Message"), ("session", "Session"), ("review", "Review"), ("progress", "Progress"), ("match", "Match"), ("system", "System")], max_length=16)),
                ("title", models.CharField(max_length=160)),
                ("body", models.CharField(blank=True, max_length=320)),
                ("action_type", models.CharField(blank=True, max_length=24)),
                ("target_id", models.PositiveIntegerField(blank=True, null=True)),
                ("dedupe_key", models.CharField(blank=True, max_length=120)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="skillswap_notifications_created", to=settings.AUTH_USER_MODEL)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="skillswap_notifications", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
