from django.urls import path
from .views import SwapListCreateView, SwapActionView

urlpatterns = [
    path("", SwapListCreateView.as_view(), name="swap-list-create"),
    path("<int:pk>/<str:action>/", SwapActionView.as_view(), name="swap-action"),
]
