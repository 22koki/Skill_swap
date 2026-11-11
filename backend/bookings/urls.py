from django.urls import path
from .views import BookingListCreateView, BookingDetailView, BookingActionView

urlpatterns = [
    path("", BookingListCreateView.as_view(), name="booking-list-create"),
    path("<int:pk>/", BookingDetailView.as_view(), name="booking-detail"),
    path("<int:pk>/<str:action>/", BookingActionView.as_view(), name="booking-action"),
]
