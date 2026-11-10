from django.utils import timezone
from rest_framework import serializers
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    partner_name = serializers.SerializerMethodField()
    offered_skill_name = serializers.CharField(source="swap.offered_skill.name", read_only=True)
    requested_skill_name = serializers.CharField(source="swap.requested_skill.name", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id", "swap", "partner_name", "offered_skill_name", "requested_skill_name",
            "starts_at", "duration_minutes", "mode", "meeting_link",
            "location_note", "note", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["status", "created_at", "updated_at"]

    def get_partner_name(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return ""
        partner = obj.swap.recipient if obj.swap.requester == request.user else obj.swap.requester
        return partner.get_full_name() or partner.username

    def validate(self, attrs):
        request = self.context["request"]
        swap = attrs.get("swap") or getattr(self.instance, "swap", None)
        starts_at = attrs.get("starts_at") or getattr(self.instance, "starts_at", None)

        if request.user not in {swap.requester, swap.recipient}:
            raise serializers.ValidationError("You are not part of this swap.")

        if swap.status != "accepted":
            raise serializers.ValidationError("Only accepted swaps can be scheduled.")

        if starts_at and starts_at <= timezone.now():
            raise serializers.ValidationError("Choose a future date and time.")

        return attrs
