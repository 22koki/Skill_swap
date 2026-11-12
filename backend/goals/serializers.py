from rest_framework import serializers
from .models import LearningGoal, Milestone


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = ["id", "title", "is_done", "completed_at", "position", "created_at"]
        read_only_fields = ["id", "completed_at", "created_at"]


class GoalSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True)
    progress = serializers.IntegerField(read_only=True)
    skill_name = serializers.CharField(source="skill.name", read_only=True, default=None)

    class Meta:
        model = LearningGoal
        fields = ["id", "title", "description", "skill", "skill_name", "target_date", "status", "progress", "milestones", "created_at", "updated_at"]
        read_only_fields = ["id", "progress", "milestones", "created_at", "updated_at"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Give your goal a title.")
        return value


class MilestoneWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = ["id", "title", "is_done", "position"]
        read_only_fields = ["id"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Milestone title is required.")
        return value
