from django.urls import path
from .views import ChallengeDashboardView, ChallengeJoinView

urlpatterns = [
    path("", ChallengeDashboardView.as_view(), name="challenge-dashboard"),
    path("<slug:slug>/join/", ChallengeJoinView.as_view(), name="challenge-join"),
]
