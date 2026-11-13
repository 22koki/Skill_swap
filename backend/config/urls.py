from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

def health(request):
    return JsonResponse({
        "service": "SkillSwap API",
        "status": "ok",
        "message": "Swap skills, grow together.",
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/", include("users.urls")),
    path("api/skills/", include("skills.urls")),
    path("api/swaps/", include("swaps.urls")),
    path("api/bookings/", include("bookings.urls")),
    path("api/messages/", include("messaging.urls")),
    path("api/workspaces/", include("workspaces.urls")),
    path("api/reviews/", include("reviews.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/circles/", include("circles.urls")),
    path("api/bookmarks/", include("bookmarks.urls")),
    path("api/goals/", include("goals.urls")),
    path("api/community/", include("community.urls")),
]
