from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking
from .serializers import BookingSerializer
from users.models import Profile

class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(
            Q(swap__requester=self.request.user) | Q(swap__recipient=self.request.user)
        ).select_related(
            "swap", "swap__requester", "swap__recipient",
            "swap__offered_skill", "swap__requested_skill",
        )

class BookingDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(
            Q(swap__requester=self.request.user) | Q(swap__recipient=self.request.user)
        ).select_related(
            "swap", "swap__requester", "swap__recipient",
            "swap__offered_skill", "swap__requested_skill",
        )

class BookingActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        booking = get_object_or_404(
            Booking.objects.select_related("swap"),
            pk=pk,
        )

        if request.user not in {booking.swap.requester, booking.swap.recipient}:
            return Response({"detail": "You are not part of this booking."}, status=403)

        if action == "cancel":
            booking.status = Booking.Status.CANCELLED
        elif action == "complete":
            if booking.status != Booking.Status.COMPLETED:
                booking.status = Booking.Status.COMPLETED
                booking.swap.status = "completed"
                booking.swap.save(update_fields=["status", "updated_at"])
                for user in (booking.swap.requester, booking.swap.recipient):
                    profile, _ = Profile.objects.get_or_create(user=user)
                    profile.completed_swaps += 1
                    profile.save(update_fields=["completed_swaps"])
            else:
                return Response({"detail": "This session is already completed."}, status=400)
        else:
            return Response({"detail": "Unknown booking action."}, status=400)

        booking.save(update_fields=["status", "updated_at"])
        return Response(BookingSerializer(booking, context={"request": request}).data)
