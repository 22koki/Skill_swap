from django.contrib.auth import get_user_model
from django.db import models
from rest_framework import serializers

from circles.models import SkillCircle, CircleMember
from skills.models import Skill
from users.safety import hidden_user_ids
from .models import Bookmark, Collection


class CollectionSerializer(serializers.ModelSerializer):
    bookmark_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Collection
        fields = ["id", "name", "description", "bookmark_count", "created_at"]
        read_only_fields = ["id", "bookmark_count", "created_at"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Collection name cannot be blank.")
        return value


class BookmarkSerializer(serializers.ModelSerializer):
    collection_ids = serializers.PrimaryKeyRelatedField(
        source="collections", queryset=Collection.objects.none(), many=True, required=False
    )
    title = serializers.SerializerMethodField()

    class Meta:
        model = Bookmark
        fields = ["id", "target_type", "target_id", "title", "collection_ids", "created_at"]
        read_only_fields = ["id", "title", "created_at"]

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            fields["collection_ids"].queryset = Collection.objects.filter(owner=request.user)
        return fields

    def get_title(self, obj):
        if obj.target_type == Bookmark.Target.USER:
            user = get_user_model().objects.filter(pk=obj.target_id).first()
            return (user.get_full_name() or user.username) if user else "Unavailable mentor"
        if obj.target_type == Bookmark.Target.SKILL:
            skill = Skill.objects.filter(pk=obj.target_id).first()
            return skill.name if skill else "Unavailable skill"
        circle = SkillCircle.objects.filter(pk=obj.target_id).first()
        return circle.title if circle else "Unavailable circle"

    def validate(self, attrs):
        request = self.context["request"]
        target_type = attrs.get("target_type", getattr(self.instance, "target_type", None))
        target_id = attrs.get("target_id", getattr(self.instance, "target_id", None))
        if target_type == Bookmark.Target.USER:
            if int(target_id) == request.user.pk:
                raise serializers.ValidationError("You cannot bookmark yourself.")
            if int(target_id) in hidden_user_ids(request.user):
                raise serializers.ValidationError("This mentor is unavailable.")
            exists = get_user_model().objects.filter(pk=target_id, is_active=True).exists()
        elif target_type == Bookmark.Target.SKILL:
            exists = Skill.objects.filter(pk=target_id).exists()
        elif target_type == Bookmark.Target.CIRCLE:
            exists = SkillCircle.objects.filter(pk=target_id).filter(
                models.Q(is_public=True) | models.Q(created_by=request.user) |
                models.Q(memberships__user=request.user)
            ).exists()
        else:
            raise serializers.ValidationError("Unsupported bookmark type.")
        if not exists:
            raise serializers.ValidationError("The selected item is unavailable.")
        return attrs

    def create(self, validated_data):
        collections = validated_data.pop("collections", [])
        bookmark, _ = Bookmark.objects.get_or_create(owner=self.context["request"].user, **validated_data)
        if collections:
            bookmark.collections.add(*collections)
        return bookmark

    def update(self, instance, validated_data):
        if "collections" in validated_data:
            instance.collections.set(validated_data["collections"])
        return instance
