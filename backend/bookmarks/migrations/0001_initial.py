from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="Collection",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=80)),
                ("description", models.CharField(blank=True, max_length=240)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="saved_collections", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["name", "id"]},
        ),
        migrations.CreateModel(
            name="Bookmark",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("target_type", models.CharField(choices=[("user", "Mentor"), ("skill", "Skill"), ("circle", "Circle")], max_length=12)),
                ("target_id", models.PositiveIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("collections", models.ManyToManyField(blank=True, related_name="bookmarks", to="bookmarks.collection")),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="bookmarks", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at", "-id"]},
        ),
        migrations.AddConstraint(model_name="collection", constraint=models.UniqueConstraint(fields=("owner", "name"), name="unique_saved_collection_name")),
        migrations.AddConstraint(model_name="bookmark", constraint=models.UniqueConstraint(fields=("owner", "target_type", "target_id"), name="unique_saved_target")),
    ]
