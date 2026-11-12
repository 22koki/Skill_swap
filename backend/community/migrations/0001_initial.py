from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="Post",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("kind", models.CharField(choices=[("update","Learning update"),("project","Project showcase"),("question","Question"),("win","Milestone win")], default="update", max_length=12)),
                ("body", models.TextField(max_length=1500)),
                ("link", models.URLField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="community_posts", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering":["-created_at","-id"]},
        ),
        migrations.CreateModel(
            name="Comment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("body", models.CharField(max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="community_comments", to=settings.AUTH_USER_MODEL)),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comments", to="community.post")),
            ],
            options={"ordering":["created_at","id"]},
        ),
        migrations.CreateModel(
            name="Reaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reactions", to="community.post")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="community_reactions", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddConstraint(model_name="reaction",constraint=models.UniqueConstraint(fields=("post","user"),name="unique_community_reaction")),
    ]
