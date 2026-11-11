from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AddField(model_name="profile", name="review_count", field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name="profile", name="teaching_rating", field=models.DecimalField(decimal_places=2, default=0, max_digits=3)),
        migrations.AddField(model_name="profile", name="communication_rating", field=models.DecimalField(decimal_places=2, default=0, max_digits=3)),
        migrations.AddField(model_name="profile", name="reliability_rating", field=models.DecimalField(decimal_places=2, default=0, max_digits=3)),
        migrations.AddField(model_name="profile", name="friendliness_rating", field=models.DecimalField(decimal_places=2, default=0, max_digits=3)),
        migrations.AddField(model_name="profile", name="would_swap_again_percent", field=models.PositiveSmallIntegerField(default=0)),
    ]
