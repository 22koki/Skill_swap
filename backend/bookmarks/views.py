from django.db.models import Count
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .models import Bookmark, Collection
from .serializers import BookmarkSerializer, CollectionSerializer


class BookmarkListCreateView(generics.ListCreateAPIView):
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Bookmark.objects.filter(owner=self.request.user).prefetch_related("collections")
        target_type = self.request.query_params.get("type")
        if target_type:
            queryset = queryset.filter(target_type=target_type)
        return queryset

    def perform_create(self, serializer):
        serializer.save()


class BookmarkDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Bookmark.objects.filter(owner=self.request.user).prefetch_related("collections")


class CollectionListCreateView(generics.ListCreateAPIView):
    serializer_class = CollectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Collection.objects.filter(owner=self.request.user).annotate(bookmark_count=Count("bookmarks", distinct=True))

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CollectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CollectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Collection.objects.filter(owner=self.request.user).annotate(bookmark_count=Count("bookmarks", distinct=True))
