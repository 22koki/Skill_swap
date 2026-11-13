from django.conf import settings
from django.db import models
from bookings.models import Booking

class SessionWorkspace(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="workspace")
    goals = models.TextField(blank=True)
    lesson_plan = models.TextField(blank=True)
    shared_notes = models.TextField(blank=True)
    progress_percentage = models.PositiveSmallIntegerField(default=0)
    ai_plan = models.JSONField(default=dict, blank=True)
    ai_plan_source = models.CharField(max_length=20, blank=True)
    ai_goal = models.CharField(max_length=500, blank=True)
    ai_learner_level = models.CharField(max_length=40, blank=True)
    ai_learning_style = models.CharField(max_length=40, blank=True)
    ai_session_count = models.PositiveSmallIntegerField(default=3)
    ai_plan_updated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Workspace for booking #{self.booking_id}"

class WorkspaceResource(models.Model):
    class Kind(models.TextChoices):
        LINK = "link", "Link"
        VIDEO = "video", "Video"
        ARTICLE = "article", "Article"
        PROJECT = "project", "Project"
        OTHER = "other", "Other"

    workspace = models.ForeignKey(SessionWorkspace, on_delete=models.CASCADE, related_name="resources")
    title = models.CharField(max_length=160)
    url = models.URLField()
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.LINK)
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workspace_resources")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

class WorkspaceChecklistItem(models.Model):
    workspace = models.ForeignKey(SessionWorkspace, on_delete=models.CASCADE, related_name="checklist")
    text = models.CharField(max_length=220)
    is_done = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workspace_checklist_items")
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="completed_workspace_checklist_items",
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class SessionRecap(models.Model):
    workspace = models.ForeignKey(SessionWorkspace, on_delete=models.CASCADE, related_name="recaps")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="skillswap_session_recaps")
    reflection = models.TextField(blank=True)
    challenge = models.CharField(max_length=500, blank=True)
    confidence = models.PositiveSmallIntegerField(default=3)
    recap = models.JSONField(default=dict, blank=True)
    source = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["workspace", "user"], name="unique_workspace_user_recap")
        ]

    def __str__(self):
        return f"Recap · workspace #{self.workspace_id} · {self.user.username}"
