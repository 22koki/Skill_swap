from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="Profile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("bio", models.TextField(blank=True)),
                ("location", models.CharField(blank=True, max_length=120)),
                ("avatar_url", models.URLField(blank=True)),
                ("session_preference", models.CharField(choices=[("online","Online"),("in_person","In person"),("both","Both")], default="both", max_length=20)),
                ("availability_note", models.CharField(blank=True, max_length=255)),
                ("completed_swaps", models.PositiveIntegerField(default=0)),
                ("average_rating", models.DecimalField(decimal_places=2, default=0, max_digits=3)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
