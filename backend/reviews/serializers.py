from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    reviewee_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id", "booking", "reviewer", "reviewer_name", "reviewee", "reviewee_name",
            "overall_rating", "teaching_quality", "communication",
            "reliability", "friendliness", "would_swap_again", "comment", "created_at",
        ]
        read_only_fields = ["reviewer", "reviewee", "created_at"]

    def get_reviewer_name(self, obj):
        return obj.reviewer.get_full_name() or obj.reviewer.username

    def get_reviewee_name(self, obj):
        return obj.reviewee.get_full_name() or obj.reviewee.username

    def validate(self, attrs):
        for field in ["overall_rating", "teaching_quality", "communication", "reliability", "friendliness"]:
            value = attrs.get(field)
            if value is None or value < 1 or value > 5:
                raise serializers.ValidationError({field: "Rating must be between 1 and 5."})
        return attrs
