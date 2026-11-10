from rest_framework import serializers
from .models import Swap

class SwapSerializer(serializers.ModelSerializer):
    requester_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    offered_skill_name = serializers.CharField(source="offered_skill.name", read_only=True)
    requested_skill_name = serializers.CharField(source="requested_skill.name", read_only=True)

    class Meta:
        model = Swap
        fields = [
            "id", "requester", "requester_name", "recipient", "recipient_name",
            "offered_skill", "offered_skill_name", "requested_skill",
            "requested_skill_name", "message", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["requester", "status", "created_at", "updated_at"]

    def get_requester_name(self, obj):
        return obj.requester.get_full_name() or obj.requester.username

    def get_recipient_name(self, obj):
        return obj.recipient.get_full_name() or obj.recipient.username

    def validate(self, attrs):
        request = self.context["request"]
        recipient = attrs.get("recipient")
        offered = attrs.get("offered_skill")
        requested = attrs.get("requested_skill")

        if recipient == request.user:
            raise serializers.ValidationError("You cannot propose a swap to yourself.")

        if not request.user.skill_links.filter(skill=offered, kind="teach").exists():
            raise serializers.ValidationError("You can only offer a skill listed under Skills I Teach.")

        if not recipient.skill_links.filter(skill=requested, kind="teach").exists():
            raise serializers.ValidationError("That user does not currently teach the requested skill.")

        return attrs
