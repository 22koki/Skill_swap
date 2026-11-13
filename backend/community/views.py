from django.db import IntegrityError
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.safety import hidden_user_ids, restriction_reason
from .models import Post, Comment, Reaction
from .serializers import PostSerializer, CommentSerializer


def visible_posts(user):
    return Post.objects.exclude(author_id__in=hidden_user_ids(user)).filter(author__is_active=True)


class CanCreateContent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    
class PostListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PostSerializer

    def get_queryset(self):
        queryset = visible_posts(self.request.user).select_related("author", "author__profile").annotate(
            reaction_count=Count("reactions", distinct=True),
            comment_count=Count("comments", distinct=True),
        )
        kind = self.request.query_params.get("kind")
        if kind in Post.Kind.values:
            queryset = queryset.filter(kind=kind)
        return queryset[:100]

    def perform_create(self, serializer):
        reason = restriction_reason(self.request.user)
        if reason:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(reason)
        serializer.save(author=self.request.user)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PostSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        if self.request.method in ("PATCH", "DELETE"):
            return Post.objects.filter(author=self.request.user)
        return visible_posts(self.request.user).select_related("author", "author__profile").annotate(
            reaction_count=Count("reactions", distinct=True),
            comment_count=Count("comments", distinct=True),
        )

    def perform_update(self, serializer):
        reason = restriction_reason(self.request.user)
        if reason:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(reason)
        serializer.save()


class ReactionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        reason = restriction_reason(request.user)
        if reason:
            return Response({"detail": reason}, status=status.HTTP_403_FORBIDDEN)
        post = get_object_or_404(visible_posts(request.user), pk=pk)
        try:
            reaction, created = Reaction.objects.get_or_create(post=post, user=request.user)
        except IntegrityError:
            created = False
        return Response({"reacted": True, "reaction_count": post.reactions.count()}, status=201 if created else 200)

    def delete(self, request, pk):
        post = get_object_or_404(visible_posts(request.user), pk=pk)
        Reaction.objects.filter(post=post, user=request.user).delete()
        return Response({"reacted": False, "reaction_count": post.reactions.count()})


class CommentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommentSerializer

    def get_queryset(self):
        post = get_object_or_404(visible_posts(self.request.user), pk=self.kwargs["pk"])
        return Comment.objects.filter(post=post).exclude(author_id__in=hidden_user_ids(self.request.user)).select_related("author")[:100]

    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        reason = restriction_reason(self.request.user)
        if reason:
            raise PermissionDenied(reason)
        post = get_object_or_404(visible_posts(self.request.user), pk=self.kwargs["pk"])
        serializer.save(post=post, author=self.request.user)


class CommentDetailView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommentSerializer

    def get_queryset(self):
        return Comment.objects.filter(author=self.request.user, post_id=self.kwargs["pk"])
