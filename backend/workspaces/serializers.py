from rest_framework import serializers
from .models import SessionWorkspace, WorkspaceResource, WorkspaceChecklistItem

class WorkspaceResourceSerializer(serializers.ModelSerializer):
    added_by_name = serializers.SerializerMethodField()

    class Meta:
        model = WorkspaceResource
        fields = ["id", "title", "url", "kind", "added_by", "added_by_name", "created_at"]
        read_only_fields = ["added_by", "created_at"]

    def get_added_by_name(self, obj):
        return obj.added_by.get_full_name() or obj.added_by.username

class WorkspaceChecklistItemSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    completed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = WorkspaceChecklistItem
        fields = [
            "id", "text", "is_done", "created_by", "created_by_name",
            "completed_by", "completed_by_name", "completed_at", "created_at",
        ]
        read_only_fields = ["created_by", "completed_by", "completed_at", "created_at"]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username

    def get_completed_by_name(self, obj):
        if not obj.completed_by:
            return ""
        return obj.completed_by.get_full_name() or obj.completed_by.username

class SessionWorkspaceSerializer(serializers.ModelSerializer):
    resources = WorkspaceResourceSerializer(many=True, read_only=True)
    checklist = WorkspaceChecklistItemSerializer(many=True, read_only=True)
    booking_status = serializers.CharField(source="booking.status", read_only=True)
    swap_id = serializers.IntegerField(source="booking.swap_id", read_only=True)
    partner_name = serializers.SerializerMethodField()
    learn_skill_name = serializers.SerializerMethodField()
    teach_skill_name = serializers.SerializerMethodField()

    class Meta:
        model = SessionWorkspace
        fields = [
            "id", "booking", "booking_status", "swap_id", "partner_name",
            "learn_skill_name", "teach_skill_name", "goals", "lesson_plan",
            "shared_notes", "progress_percentage", "ai_plan", "ai_plan_source", "ai_goal",
            "ai_learner_level", "ai_learning_style", "ai_session_count", "ai_plan_updated_at",
            "resources", "checklist",
            "created_at", "updated_at",
        ]
        read_only_fields = ["booking", "ai_plan_source", "ai_plan_updated_at", "created_at", "updated_at"]

    def _request_user(self):
        request = self.context.get("request")
        return request.user if request and request.user.is_authenticated else None

    def _partner(self, obj):
        user = self._request_user()
        if not user:
            return None
        swap = obj.booking.swap
        return swap.recipient if swap.requester == user else swap.requester

    def get_partner_name(self, obj):
        partner = self._partner(obj)
        return (partner.get_full_name() or partner.username) if partner else ""

    def get_learn_skill_name(self, obj):
        user = self._request_user()
        swap = obj.booking.swap
        if not user:
            return swap.requested_skill.name
        return swap.requested_skill.name if swap.requester == user else swap.offered_skill.name

    def get_teach_skill_name(self, obj):
        user = self._request_user()
        swap = obj.booking.swap
        if not user:
            return swap.offered_skill.name
        return swap.offered_skill.name if swap.requester == user else swap.requested_skill.name

    def validate_progress_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Progress must be between 0 and 100.")
        return value
