from django.conf import settings
from django.db import models


class Collection(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_collections")
    name = models.CharField(max_length=80)
    description = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name", "id"]
        constraints = [models.UniqueConstraint(fields=["owner", "name"], name="unique_saved_collection_name")]

    def __str__(self):
        return f"{self.owner} / {self.name}"


class Bookmark(models.Model):
    class Target(models.TextChoices):
        USER = "user", "Mentor"
        SKILL = "skill", "Skill"
        CIRCLE = "circle", "Circle"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookmarks")
    target_type = models.CharField(max_length=12, choices=Target.choices)
    target_id = models.PositiveIntegerField()
    collections = models.ManyToManyField(Collection, blank=True, related_name="bookmarks")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [models.UniqueConstraint(fields=["owner", "target_type", "target_id"], name="unique_saved_target")]

    def __str__(self):
        return f"{self.owner}: {self.target_type}/{self.target_id}"
