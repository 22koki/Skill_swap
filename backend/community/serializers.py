from rest_framework import serializers

from .models import Post, Comment


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "body", "created_at", "author", "author_name", "is_mine"]
        read_only_fields = ["id", "author", "author_name", "is_mine", "created_at"]

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def get_is_mine(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and request.user.pk == obj.author_id)

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError("Write a comment first.")
        return value.strip()


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    reaction_count = serializers.IntegerField(read_only=True, default=0)
    comment_count = serializers.IntegerField(read_only=True, default=0)
    reacted = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ["id", "author", "author_name", "author_avatar", "kind", "body", "link", "created_at",
                  "updated_at", "reaction_count", "comment_count", "reacted", "is_mine"]
        read_only_fields = ["id", "author", "author_name", "author_avatar", "created_at",
                            "updated_at", "reaction_count", "comment_count", "reacted", "is_mine"]

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def get_author_avatar(self, obj):
        profile = getattr(obj.author, "profile", None)
        return profile.avatar_url if profile else ""

    def get_reacted(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.reactions.filter(user=request.user).exists()

    def get_is_mine(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and request.user.pk == obj.author_id)

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError("Your post needs some text.")
        return value.strip()
