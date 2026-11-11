from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile, AvailabilitySlot, UserBlock, SafetyReport, AccountStanding

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "bio", "location", "avatar_url", "session_preference",
            "availability_note", "completed_swaps", "average_rating", "review_count",
            "teaching_rating", "communication_rating", "reliability_rating",
            "friendliness_rating", "would_swap_again_percent",
        ]
        read_only_fields = ["completed_swaps", "average_rating", "review_count", "teaching_rating", "communication_rating", "reliability_rating", "friendliness_rating", "would_swap_again_percent"]

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff", "profile"]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        profile, _ = Profile.objects.get_or_create(user=instance)
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        Profile.objects.get_or_create(user=user)
        return user


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilitySlot
        fields = ["id", "weekday", "start_time", "end_time"]
        read_only_fields = ["id"]

    def validate_weekday(self, value):
        if value < 0 or value > 6:
            raise serializers.ValidationError("Weekday must be between 0 and 6.")
        return value

    def validate(self, attrs):
        if attrs["end_time"] <= attrs["start_time"]:
            raise serializers.ValidationError("End time must be after start time.")
        return attrs


class UserBlockSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="blocked.id", read_only=True)
    username = serializers.CharField(source="blocked.username", read_only=True)
    name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = UserBlock
        fields = ["id", "user_id", "username", "name", "avatar_url", "created_at"]

    def get_name(self, obj):
        return obj.blocked.get_full_name() or obj.blocked.username

    def get_avatar_url(self, obj):
        profile = getattr(obj.blocked, "profile", None)
        return profile.avatar_url if profile else ""


class AccountStandingSerializer(serializers.ModelSerializer):
    restricted = serializers.SerializerMethodField()

    class Meta:
        model = AccountStanding
        fields = ["warning_count", "restricted_until", "restricted", "suspended", "note", "updated_at"]

    def get_restricted(self, obj):
        from django.utils import timezone
        return bool(obj.restricted_until and obj.restricted_until > timezone.now())


class SafetyReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.SerializerMethodField()
    reported_user_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SafetyReport
        fields = [
            "id", "reporter", "reporter_name", "reported_user", "reported_user_name",
            "target_type", "target_id", "reason", "details", "evidence",
            "status", "resolution_action", "resolution_note",
            "reviewed_by", "reviewed_by_name", "reviewed_at", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "reporter", "reporter_name", "reported_user_name", "evidence",
            "status", "resolution_action", "resolution_note",
            "reviewed_by", "reviewed_by_name", "reviewed_at", "created_at", "updated_at",
        ]

    def get_reporter_name(self, obj):
        return obj.reporter.get_full_name() or obj.reporter.username

    def get_reported_user_name(self, obj):
        if not obj.reported_user:
            return ""
        return obj.reported_user.get_full_name() or obj.reported_user.username

    def get_reviewed_by_name(self, obj):
        if not obj.reviewed_by:
            return ""
        return obj.reviewed_by.get_full_name() or obj.reviewed_by.username
