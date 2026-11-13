from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("workspaces", "0002_sessionworkspace_ai_plan"),
    ]

    operations = [
        migrations.CreateModel(
            name="SessionRecap",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reflection", models.TextField(blank=True)),
                ("challenge", models.CharField(blank=True, max_length=500)),
                ("confidence", models.PositiveSmallIntegerField(default=3)),
                ("recap", models.JSONField(blank=True, default=dict)),
                ("source", models.CharField(blank=True, max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="skillswap_session_recaps", to=settings.AUTH_USER_MODEL)),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="recaps", to="workspaces.sessionworkspace")),
            ],
        ),
        migrations.AddConstraint(
            model_name="sessionrecap",
            constraint=models.UniqueConstraint(fields=("workspace", "user"), name="unique_workspace_user_recap"),
        ),
    ]
