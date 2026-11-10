from django.contrib import admin
from django.http import JsonResponse
from django.urls import path

def health(request):
    return JsonResponse({
        "service": "SkillSwap API",
        "status": "ok",
        "message": "Swap skills, grow together.",
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
]
