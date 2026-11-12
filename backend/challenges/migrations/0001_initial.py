from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="ChallengeEnrollment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(max_length=64)),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="challenge_enrollments", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-joined_at"]},
        ),
        migrations.AddConstraint(
            model_name="challengeenrollment",
            constraint=models.UniqueConstraint(fields=("user", "slug"), name="unique_challenge_enrollment"),
        ),
    ]
