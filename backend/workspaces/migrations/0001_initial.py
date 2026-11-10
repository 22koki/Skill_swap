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
            name="SessionWorkspace",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("goals", models.TextField(blank=True)),
                ("lesson_plan", models.TextField(blank=True)),
                ("shared_notes", models.TextField(blank=True)),
                ("progress_percentage", models.PositiveSmallIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("booking", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="workspace", to="bookings.booking")),
            ],
        ),
        migrations.CreateModel(
            name="WorkspaceResource",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=160)),
                ("url", models.URLField()),
                ("kind", models.CharField(choices=[("link","Link"),("video","Video"),("article","Article"),("project","Project"),("other","Other")], default="link", max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("added_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="workspace_resources", to=settings.AUTH_USER_MODEL)),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="resources", to="workspaces.sessionworkspace")),
            ],
            options={"ordering":["-created_at"]},
        ),
        migrations.CreateModel(
            name="WorkspaceChecklistItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text", models.CharField(max_length=220)),
                ("is_done", models.BooleanField(default=False)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("completed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="completed_workspace_checklist_items", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="workspace_checklist_items", to=settings.AUTH_USER_MODEL)),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="checklist", to="workspaces.sessionworkspace")),
            ],
            options={"ordering":["created_at"]},
        ),
    ]
