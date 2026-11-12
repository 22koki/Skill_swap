from django.urls import path
from .views import PostListCreateView, PostDetailView, ReactionView, CommentListCreateView, CommentDetailView

urlpatterns = [
    path("", PostListCreateView.as_view(), name="community-list"),
    path("<int:pk>/", PostDetailView.as_view(), name="community-detail"),
    path("<int:pk>/react/", ReactionView.as_view(), name="community-react"),
    path("<int:pk>/comments/", CommentListCreateView.as_view(), name="community-comments"),
    path("<int:pk>/comments/<int:comment_id>/", CommentDetailView.as_view(lookup_url_kwarg="comment_id"), name="community-comment-detail"),
]
