from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, MeView, PublicProfileView, CommunityUsersView, SkillPassportView, MyAvailabilityView, UserProgressionView, SkillNetworkView, UniversalSearchView, BlockedUsersView, UserBlockView, SafetyReportCreateView, MySafetyView, ModerationQueueView, ModerationReportActionView, HomeDashboardView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("dashboard/", HomeDashboardView.as_view(), name="home-dashboard"),
    path("profiles/<int:user_id>/", PublicProfileView.as_view(), name="public-profile"),
    path("community/", CommunityUsersView.as_view(), name="community-users"),
    path("network/", SkillNetworkView.as_view(), name="skill-network"),
    path("search/", UniversalSearchView.as_view(), name="universal-search"),
    path("availability/", MyAvailabilityView.as_view(), name="my-availability"),
    path("passports/<int:user_id>/", SkillPassportView.as_view(), name="skill-passport"),
    path("progression/<int:user_id>/", UserProgressionView.as_view(), name="user-progression"),
    path("safety/", MySafetyView.as_view(), name="my-safety"),
    path("safety/blocked/", BlockedUsersView.as_view(), name="blocked-users"),
    path("safety/block/<int:user_id>/", UserBlockView.as_view(), name="user-block"),
    path("safety/reports/", SafetyReportCreateView.as_view(), name="safety-report-create"),
    path("safety/moderation/", ModerationQueueView.as_view(), name="moderation-queue"),
    path("safety/moderation/<int:pk>/<str:action>/", ModerationReportActionView.as_view(), name="moderation-report-action"),
]
