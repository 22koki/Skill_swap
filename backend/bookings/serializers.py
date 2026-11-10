from django.utils import timezone
from rest_framework import serializers
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    partner_name = serializers.SerializerMethodField()
    partner_profile = serializers.SerializerMethodField()
    learn_skill_name = serializers.SerializerMethodField()
    teach_skill_name = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id", "swap", "partner_name", "partner_profile",
            "learn_skill_name", "teach_skill_name",
            "starts_at", "duration_minutes", "mode", "meeting_link",
            "location_note", "note", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["status", "created_at", "updated_at"]

    def _partner(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        return obj.swap.recipient if obj.swap.requester == request.user else obj.swap.requester

    def get_partner_name(self, obj):
        partner = self._partner(obj)
        return (partner.get_full_name() or partner.username) if partner else ""

    def get_partner_profile(self, obj):
        partner = self._partner(obj)
        profile = getattr(partner, "profile", None) if partner else None
        if not profile:
            return {
                "avatar_url": "",
                "location": "",
                "average_rating": 0,
                "completed_swaps": 0,
            }
        return {
            "avatar_url": profile.avatar_url,
            "location": profile.location,
            "average_rating": float(profile.average_rating),
            "completed_swaps": profile.completed_swaps,
        }

    def get_learn_skill_name(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return obj.swap.requested_skill.name
        return obj.swap.requested_skill.name if obj.swap.requester == request.user else obj.swap.offered_skill.name

    def get_teach_skill_name(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return obj.swap.offered_skill.name
        return obj.swap.offered_skill.name if obj.swap.requester == request.user else obj.swap.requested_skill.name

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

        if not self.instance and Booking.objects.filter(swap=swap, status=Booking.Status.SCHEDULED).exists():
            raise serializers.ValidationError("This swap already has an upcoming booking.")

        return attrs
