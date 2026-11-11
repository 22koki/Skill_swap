from django.urls import path
from .views import BookingListCreateView, BookingDetailView, BookingActionView, BookingSuggestionsView, BookingTimeCheckView, BookingRescheduleView, BookingRescheduleActionView, CalendarView

urlpatterns = [
    path("", BookingListCreateView.as_view(), name="booking-list-create"),
    path("calendar/", CalendarView.as_view(), name="calendar"),
    path("swaps/<int:swap_id>/suggestions/", BookingSuggestionsView.as_view(), name="booking-suggestions"),
    path("<int:pk>/", BookingDetailView.as_view(), name="booking-detail"),
    path("<int:pk>/check-time/", BookingTimeCheckView.as_view(), name="booking-time-check"),
    path("<int:pk>/reschedule/", BookingRescheduleView.as_view(), name="booking-reschedule"),
    path("reschedules/<int:pk>/<str:action>/", BookingRescheduleActionView.as_view(), name="booking-reschedule-action"),
    path("<int:pk>/<str:action>/", BookingActionView.as_view(), name="booking-action"),
]
