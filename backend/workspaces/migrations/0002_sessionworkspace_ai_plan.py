from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("workspaces", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="sessionworkspace",
            name="ai_plan",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="sessionworkspace",
            name="ai_plan_source",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="sessionworkspace",
            name="ai_goal",
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name="sessionworkspace",
            name="ai_learner_level",
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name="sessionworkspace",
            name="ai_learning_style",
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name="sessionworkspace",
            name="ai_session_count",
            field=models.PositiveSmallIntegerField(default=3),
        ),
        migrations.AddField(
            model_name="sessionworkspace",
            name="ai_plan_updated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
