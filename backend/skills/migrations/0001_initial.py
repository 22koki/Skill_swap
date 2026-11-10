from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="SkillCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=80, unique=True)),
                ("icon", models.CharField(blank=True, max_length=32)),
            ],
            options={"ordering":["name"]},
        ),
        migrations.CreateModel(
            name="Skill",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100, unique=True)),
                ("description", models.TextField(blank=True)),
                ("category", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="skills", to="skills.skillcategory")),
            ],
            options={"ordering":["name"]},
        ),
        migrations.CreateModel(
            name="UserSkill",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("kind", models.CharField(choices=[("teach","Can teach"),("learn","Wants to learn")], max_length=12)),
                ("level", models.CharField(choices=[("beginner","Beginner"),("intermediate","Intermediate"),("advanced","Advanced"),("expert","Expert")], default="beginner", max_length=16)),
                ("description", models.TextField(blank=True)),
                ("skill", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="user_links", to="skills.skill")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="skill_links", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddConstraint(
            model_name="userskill",
            constraint=models.UniqueConstraint(fields=("user","skill","kind"), name="unique_user_skill_kind"),
        ),
    ]
