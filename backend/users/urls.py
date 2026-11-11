from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, MeView, PublicProfileView, CommunityUsersView, SkillPassportView, MyAvailabilityView, UserProgressionView, SkillNetworkView, UniversalSearchView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("profiles/<int:user_id>/", PublicProfileView.as_view(), name="public-profile"),
    path("community/", CommunityUsersView.as_view(), name="community-users"),
    path("network/", SkillNetworkView.as_view(), name="skill-network"),
    path("search/", UniversalSearchView.as_view(), name="universal-search"),
    path("availability/", MyAvailabilityView.as_view(), name="my-availability"),
    path("passports/<int:user_id>/", SkillPassportView.as_view(), name="skill-passport"),
    path("progression/<int:user_id>/", UserProgressionView.as_view(), name="user-progression"),
]
