from django.conf import settings
from django.db import models

class SkillCategory(models.Model):
    name = models.CharField(max_length=80, unique=True)
    icon = models.CharField(max_length=32, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

class Skill(models.Model):
    category = models.ForeignKey(
        SkillCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="skills",
    )
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

class UserSkill(models.Model):
    class Kind(models.TextChoices):
        TEACH = "teach", "Can teach"
        LEARN = "learn", "Wants to learn"

    class Level(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"
        EXPERT = "expert", "Expert"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="skill_links")
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="user_links")
    kind = models.CharField(max_length=12, choices=Kind.choices)
    level = models.CharField(max_length=16, choices=Level.choices, default=Level.BEGINNER)
    description = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "skill", "kind"], name="unique_user_skill_kind")
        ]

    def __str__(self):
        return f"{self.user.username} · {self.skill.name} · {self.kind}"
