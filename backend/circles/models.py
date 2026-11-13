from django.conf import settings
from django.db import models
from django.utils.text import slugify

from skills.models import Skill


class SkillCircle(models.Model):
    class CircleType(models.TextChoices):
        LEARN = "learn", "Learn a Skill"
        PROJECT = "project", "Build a Project"
        CAREER = "career", "Career Prep"
        CREATIVE = "creative", "Creative Challenge"
        STUDY = "study", "Study Group"

    title = models.CharField(max_length=140)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    circle_type = models.CharField(max_length=20, choices=CircleType.choices, default=CircleType.LEARN)
    primary_skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True, blank=True, related_name="circles")
    description = models.TextField(blank=True)
    goal = models.CharField(max_length=500, blank=True)
    cover_emoji = models.CharField(max_length=16, blank=True, default="✦")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_skill_circles")
    is_public = models.BooleanField(default=True)
    ai_plan = models.JSONField(default=dict, blank=True)
    ai_plan_source = models.CharField(max_length=20, blank=True)
    ai_plan_updated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title) or "skill-circle"
            slug = base
            index = 2
            while SkillCircle.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{index}"
                index += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class CircleMember(models.Model):
    class Role(models.TextChoices):
        MENTOR = "mentor", "Mentor"
        LEARNER = "learner", "Learner"

    circle = models.ForeignKey(SkillCircle, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="circle_memberships")
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.LEARNER)
    is_muted = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["joined_at"]
        constraints = [
            models.UniqueConstraint(fields=["circle", "user"], name="unique_circle_member")
        ]


class CircleMessage(models.Model):
    circle = models.ForeignKey(SkillCircle, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="circle_messages")
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class CircleSession(models.Model):
    class Mode(models.TextChoices):
        ONLINE = "online", "Online"
        IN_PERSON = "in_person", "In person"

    circle = models.ForeignKey(SkillCircle, on_delete=models.CASCADE, related_name="sessions")
    title = models.CharField(max_length=160)
    starts_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    mode = models.CharField(max_length=16, choices=Mode.choices, default=Mode.ONLINE)
    meeting_link = models.URLField(blank=True)
    location_note = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="circle_sessions_created")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["starts_at"]


class CircleTask(models.Model):
    circle = models.ForeignKey(SkillCircle, on_delete=models.CASCADE, related_name="tasks")
    text = models.CharField(max_length=240)
    is_done = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="circle_tasks_created")
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="circle_tasks_completed",
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class CircleResource(models.Model):
    class Kind(models.TextChoices):
        LINK = "link", "Link"
        VIDEO = "video", "Video"
        ARTICLE = "article", "Article"
        PROJECT = "project", "Project"
        OTHER = "other", "Other"

    circle = models.ForeignKey(SkillCircle, on_delete=models.CASCADE, related_name="resources")
    title = models.CharField(max_length=160)
    url = models.URLField()
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.LINK)
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="circle_resources_added")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
