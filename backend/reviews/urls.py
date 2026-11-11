from django.urls import path
from .views import ReviewCreateView, MyReviewsView, UserReputationView

urlpatterns = [
    path("", ReviewCreateView.as_view(), name="review-create"),
    path("mine/", MyReviewsView.as_view(), name="my-reviews"),
    path("reputation/<int:user_id>/", UserReputationView.as_view(), name="user-reputation"),
]
