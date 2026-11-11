from rest_framework import serializers
from .models import Notification, NotificationPreference

class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    actor_avatar_url = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id", "kind", "title", "body", "action_type", "target_id",
            "metadata", "actor_name", "actor_avatar_url", "is_read", "created_at",
        ]

    def get_actor_name(self, obj):
        if not obj.actor:
            return ""
        return obj.actor.get_full_name() or obj.actor.username

    def get_actor_avatar_url(self, obj):
        profile = getattr(obj.actor, "profile", None) if obj.actor else None
        return profile.avatar_url if profile else ""

    def get_is_read(self, obj):
        return bool(obj.read_at)


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ["swaps", "messages", "sessions", "reviews", "progress", "matches"]
