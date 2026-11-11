from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile, AvailabilitySlot

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
        fields = ["id", "username", "email", "first_name", "last_name", "profile"]

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
