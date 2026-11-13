from django.conf import settings
from django.db import models
from django.utils import timezone


class LearningGoal(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        COMPLETED = "completed", "Completed"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="learning_goals")
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    skill = models.ForeignKey("skills.Skill", on_delete=models.SET_NULL, blank=True, null=True, related_name="learning_goals")
    target_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-id"]

    @property
    def progress(self):
        total = self.milestones.count()
        if not total:
            return 0
        return round(self.milestones.filter(is_done=True).count() / total * 100)


class Milestone(models.Model):
    goal = models.ForeignKey(LearningGoal, on_delete=models.CASCADE, related_name="milestones")
    title = models.CharField(max_length=180)
    is_done = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "id"]
