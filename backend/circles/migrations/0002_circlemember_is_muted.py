from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("circles", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="circlemember",
            name="is_muted",
            field=models.BooleanField(default=False),
        ),
    ]
