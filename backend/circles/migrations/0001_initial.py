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
            name="SkillCircle",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=140)),
                ("slug", models.SlugField(blank=True, max_length=170, unique=True)),
                ("circle_type", models.CharField(choices=[("learn", "Learn a Skill"), ("project", "Build a Project"), ("career", "Career Prep"), ("creative", "Creative Challenge"), ("study", "Study Group")], default="learn", max_length=20)),
                ("description", models.TextField(blank=True)),
                ("goal", models.CharField(blank=True, max_length=500)),
                ("cover_emoji", models.CharField(blank=True, default="✦", max_length=16)),
                ("is_public", models.BooleanField(default=True)),
                ("ai_plan", models.JSONField(blank=True, default=dict)),
                ("ai_plan_source", models.CharField(blank=True, max_length=20)),
                ("ai_plan_updated_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="created_skill_circles", to=settings.AUTH_USER_MODEL)),
                ("primary_skill", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="circles", to="skills.skill")),
            ],
            options={"ordering": ["-updated_at", "-created_at"]},
        ),
        migrations.CreateModel(
            name="CircleMember",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("mentor", "Mentor"), ("learner", "Learner")], default="learner", max_length=12)),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                ("circle", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="memberships", to="circles.skillcircle")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="circle_memberships", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["joined_at"]},
        ),
        migrations.CreateModel(
            name="CircleMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("body", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("circle", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="circles.skillcircle")),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="circle_messages", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["created_at"]},
        ),
        migrations.CreateModel(
            name="CircleSession",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=160)),
                ("starts_at", models.DateTimeField()),
                ("duration_minutes", models.PositiveIntegerField(default=60)),
                ("mode", models.CharField(choices=[("online", "Online"), ("in_person", "In person")], default="online", max_length=16)),
                ("meeting_link", models.URLField(blank=True)),
                ("location_note", models.CharField(blank=True, max_length=255)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("circle", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sessions", to="circles.skillcircle")),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="circle_sessions_created", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["starts_at"]},
        ),
        migrations.CreateModel(
            name="CircleTask",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text", models.CharField(max_length=240)),
                ("is_done", models.BooleanField(default=False)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("circle", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tasks", to="circles.skillcircle")),
                ("completed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="circle_tasks_completed", to=settings.AUTH_USER_MODEL)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="circle_tasks_created", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["created_at"]},
        ),
        migrations.CreateModel(
            name="CircleResource",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=160)),
                ("url", models.URLField()),
                ("kind", models.CharField(choices=[("link", "Link"), ("video", "Video"), ("article", "Article"), ("project", "Project"), ("other", "Other")], default="link", max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("added_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="circle_resources_added", to=settings.AUTH_USER_MODEL)),
                ("circle", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="resources", to="circles.skillcircle")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="circlemember",
            constraint=models.UniqueConstraint(fields=("circle", "user"), name="unique_circle_member"),
        ),
    ]
