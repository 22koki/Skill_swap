from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "sender", "sender_name", "sender_avatar_url", "body", "created_at", "delivered_at", "read_at"]
        read_only_fields = ["sender", "created_at", "delivered_at", "read_at"]

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username

    def get_sender_avatar_url(self, obj):
        profile = getattr(obj.sender, "profile", None)
        return profile.avatar_url if profile else ""

class ConversationSerializer(serializers.ModelSerializer):
    partner_id = serializers.SerializerMethodField()
    partner_name = serializers.SerializerMethodField()
    partner_avatar_url = serializers.SerializerMethodField()
    partner_location = serializers.SerializerMethodField()
    offered_skill_name = serializers.CharField(source="swap.offered_skill.name", read_only=True)
    requested_skill_name = serializers.CharField(source="swap.requested_skill.name", read_only=True)
    swap_status = serializers.CharField(source="swap.status", read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    partner_online = serializers.SerializerMethodField()
    partner_last_seen = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id", "swap", "partner_id", "partner_name", "partner_avatar_url", "partner_location",
            "offered_skill_name", "requested_skill_name", "swap_status",
            "last_message", "unread_count", "partner_online", "partner_last_seen", "created_at", "updated_at",
        ]

    def _partner(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        return obj.swap.recipient if obj.swap.requester == request.user else obj.swap.requester

    def get_partner_id(self, obj):
        partner = self._partner(obj)
        return partner.id if partner else None

    def get_partner_name(self, obj):
        partner = self._partner(obj)
        return (partner.get_full_name() or partner.username) if partner else ""

    def get_partner_avatar_url(self, obj):
        partner = self._partner(obj)
        profile = getattr(partner, "profile", None) if partner else None
        return profile.avatar_url if profile else ""

    def get_partner_location(self, obj):
        partner = self._partner(obj)
        profile = getattr(partner, "profile", None) if partner else None
        return profile.location if profile else ""

    def get_last_message(self, obj):
        message = obj.messages.order_by("-created_at").first()
        return MessageSerializer(message).data if message else None

    def get_partner_online(self, obj):
        presence = _presence_for(self._partner(obj))
        return bool(presence and presence.connection_count > 0)

    def get_partner_last_seen(self, obj):
        presence = _presence_for(self._partner(obj))
        return presence.last_seen if presence else None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.exclude(sender=request.user).filter(read_at__isnull=True).count()


def _presence_for(partner):
    if not partner:
        return None
    return getattr(partner, "realtime_presence", None)
