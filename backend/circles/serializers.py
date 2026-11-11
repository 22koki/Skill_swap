from django.utils import timezone
from rest_framework import serializers

from users.models import Profile
from .models import SkillCircle, CircleMember, CircleMessage, CircleSession, CircleTask, CircleResource


def user_avatar(user):
    try:
        return user.profile.avatar_url
    except Profile.DoesNotExist:
        return ""


class CircleMemberSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.SerializerMethodField()
    username = serializers.CharField(source="user.username", read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = CircleMember
        fields = ["id", "user_id", "name", "username", "avatar_url", "role", "is_muted", "joined_at"]

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_avatar_url(self, obj):
        return user_avatar(obj.user)


class CircleMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = CircleMessage
        fields = ["id", "sender_id", "sender_name", "sender_avatar_url", "body", "created_at"]
        read_only_fields = ["id", "sender_id", "sender_name", "sender_avatar_url", "created_at"]

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username

    def get_sender_avatar_url(self, obj):
        return user_avatar(obj.sender)


class CircleSessionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CircleSession
        fields = [
            "id", "title", "starts_at", "duration_minutes", "mode",
            "meeting_link", "location_note", "notes", "created_by_name", "created_at",
        ]
        read_only_fields = ["id", "created_by_name", "created_at"]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username


class CircleTaskSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    completed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CircleTask
        fields = [
            "id", "text", "is_done", "created_by_name",
            "completed_by_name", "completed_at", "created_at",
        ]
        read_only_fields = ["id", "created_by_name", "completed_by_name", "completed_at", "created_at"]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username

    def get_completed_by_name(self, obj):
        if not obj.completed_by:
            return ""
        return obj.completed_by.get_full_name() or obj.completed_by.username


class CircleResourceSerializer(serializers.ModelSerializer):
    added_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CircleResource
        fields = ["id", "title", "url", "kind", "added_by_name", "created_at"]
        read_only_fields = ["id", "added_by_name", "created_at"]

    def get_added_by_name(self, obj):
        return obj.added_by.get_full_name() or obj.added_by.username


class SkillCircleSerializer(serializers.ModelSerializer):
    primary_skill_name = serializers.CharField(source="primary_skill.name", read_only=True)
    primary_skill_category = serializers.CharField(source="primary_skill.category.name", read_only=True)
    creator_name = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    mentor_count = serializers.SerializerMethodField()
    learner_count = serializers.SerializerMethodField()
    members = CircleMemberSerializer(source="memberships", many=True, read_only=True)
    sessions = CircleSessionSerializer(many=True, read_only=True)
    tasks = CircleTaskSerializer(many=True, read_only=True)
    resources = CircleResourceSerializer(many=True, read_only=True)
    membership = serializers.SerializerMethodField()
    next_session = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = SkillCircle
        fields = [
            "id", "title", "slug", "circle_type", "primary_skill", "primary_skill_name", "created_by",
            "primary_skill_category", "description", "goal", "cover_emoji", "creator_name",
            "is_public", "member_count", "mentor_count", "learner_count", "membership",
            "members", "sessions", "tasks", "resources", "next_session", "progress_percentage",
            "ai_plan", "ai_plan_source", "ai_plan_updated_at", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "slug", "created_by", "creator_name", "member_count", "mentor_count", "learner_count",
            "membership", "members", "sessions", "tasks", "resources", "next_session",
            "progress_percentage", "ai_plan", "ai_plan_source", "ai_plan_updated_at",
            "created_at", "updated_at",
        ]

    def get_creator_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_mentor_count(self, obj):
        return obj.memberships.filter(role=CircleMember.Role.MENTOR).count()

    def get_learner_count(self, obj):
        return obj.memberships.filter(role=CircleMember.Role.LEARNER).count()

    def get_membership(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        membership = obj.memberships.filter(user=request.user).first()
        if not membership:
            return None
        return {"id": membership.id, "role": membership.role}

    def get_next_session(self, obj):
        session = obj.sessions.filter(starts_at__gte=timezone.now()).order_by("starts_at").first()
        return CircleSessionSerializer(session).data if session else None

    def get_progress_percentage(self, obj):
        total = obj.tasks.count()
        if not total:
            return 0
        done = obj.tasks.filter(is_done=True).count()
        return round((done / total) * 100)
