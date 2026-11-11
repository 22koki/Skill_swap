from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0003_availabilityslot"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AccountStanding",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("warning_count", models.PositiveIntegerField(default=0)),
                ("restricted_until", models.DateTimeField(blank=True, null=True)),
                ("suspended", models.BooleanField(default=False)),
                ("note", models.TextField(blank=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="account_standing", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="UserBlock",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("blocked", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="blocks_received", to=settings.AUTH_USER_MODEL)),
                ("blocker", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="blocks_created", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="SafetyReport",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("target_type", models.CharField(choices=[("user","User"),("message","Message"),("circle","Circle"),("circle_message","Circle message")], max_length=24)),
                ("target_id", models.PositiveIntegerField(blank=True, null=True)),
                ("reason", models.CharField(choices=[("harassment","Harassment"),("spam","Spam"),("scam","Scam or fraud"),("inappropriate","Inappropriate behaviour"),("fake_profile","Fake profile"),("other","Other")], max_length=24)),
                ("details", models.TextField(blank=True)),
                ("evidence", models.JSONField(blank=True, default=dict)),
                ("status", models.CharField(choices=[("open","Open"),("reviewing","Reviewing"),("resolved","Resolved"),("dismissed","Dismissed")], default="open", max_length=16)),
                ("resolution_action", models.CharField(choices=[("none","None"),("warn","Warn"),("restrict","Restrict"),("suspend","Suspend")], default="none", max_length=16)),
                ("resolution_note", models.TextField(blank=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("reported_user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="safety_reports_received", to=settings.AUTH_USER_MODEL)),
                ("reporter", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="safety_reports_made", to=settings.AUTH_USER_MODEL)),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="safety_reports_reviewed", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="userblock",
            constraint=models.UniqueConstraint(fields=("blocker","blocked"), name="unique_user_block"),
        ),
    ]
