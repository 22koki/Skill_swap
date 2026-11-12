from django.urls import path
from .views import BookmarkListCreateView, BookmarkDetailView, CollectionListCreateView, CollectionDetailView

urlpatterns = [
    path("", BookmarkListCreateView.as_view(), name="bookmark-list"),
    path("<int:pk>/", BookmarkDetailView.as_view(), name="bookmark-detail"),
    path("collections/", CollectionListCreateView.as_view(), name="collection-list"),
    path("collections/<int:pk>/", CollectionDetailView.as_view(), name="collection-detail"),
]
