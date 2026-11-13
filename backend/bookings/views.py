from datetime import timedelta

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking, RescheduleRequest
from .serializers import BookingSerializer, RescheduleRequestSerializer
from users.models import Profile
from notifications.models import Notification
from notifications.services import notify
from .scheduling import suggest_times, evaluate_time

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

    def perform_create(self, serializer):
        booking = serializer.save()
        partner = booking.swap.recipient if booking.swap.requester == self.request.user else booking.swap.requester
        notify(
            partner,
            Notification.Kind.SESSION,
            "A SkillSwap session was scheduled",
            booking.starts_at.strftime("%a %d %b · %H:%M"),
            actor=self.request.user,
            action_type="booking",
            target_id=booking.id,
            dedupe_key=f"booking-created:{booking.id}",
            metadata={"swap_id": booking.swap_id},
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
            if booking.status != Booking.Status.SCHEDULED:
                return Response({"detail": "Only scheduled sessions can be cancelled."}, status=400)
            booking.status = Booking.Status.CANCELLED
            partner = booking.swap.recipient if booking.swap.requester == request.user else booking.swap.requester
            notify(partner, Notification.Kind.SESSION, "A SkillSwap session was cancelled", "Open the swap to plan a new time.", actor=request.user, action_type="booking", target_id=booking.id, dedupe_key=f"booking-cancelled:{booking.id}")
        elif action == "complete":
            if booking.status != Booking.Status.SCHEDULED:
                return Response({"detail": "Only scheduled sessions can be completed."}, status=400)
            if booking.starts_at > timezone.now():
                return Response({"detail": "A future session cannot be marked complete."}, status=400)
            if booking.status == Booking.Status.SCHEDULED:
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


class BookingSuggestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, swap_id):
        from swaps.models import Swap

        swap = get_object_or_404(Swap, pk=swap_id)
        if request.user not in {swap.requester, swap.recipient}:
            return Response({"detail": "You are not part of this swap."}, status=403)
        if swap.status != "accepted":
            return Response({"detail": "Only accepted swaps can be scheduled."}, status=400)

        try:
            duration = max(30, min(int(request.query_params.get("duration", 60)), 180))
        except (TypeError, ValueError):
            duration = 60

        partner = swap.recipient if swap.requester == request.user else swap.requester
        suggestions = suggest_times(request.user, partner, duration_minutes=duration, limit=6)

        return Response({
            "suggestions": suggestions,
            "availability_complete": bool(request.user.availability_slots.exists() and partner.availability_slots.exists()),
            "partner_name": partner.get_full_name() or partner.username,
        })


class BookingTimeCheckView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking.objects.select_related("swap__requester", "swap__recipient"), pk=pk)
        if request.user not in {booking.swap.requester, booking.swap.recipient}:
            return Response({"detail": "You are not part of this booking."}, status=403)

        starts_at = request.data.get("starts_at")
        duration = request.data.get("duration_minutes", booking.duration_minutes)
        serializer = RescheduleRequestSerializer(data={
            "proposed_starts_at": starts_at,
            "proposed_duration_minutes": duration,
            "proposed_mode": request.data.get("mode", booking.mode),
            "proposed_meeting_link": request.data.get("meeting_link", booking.meeting_link),
            "proposed_location_note": request.data.get("location_note", booking.location_note),
            "note": request.data.get("note", ""),
        })
        serializer.is_valid(raise_exception=True)

        proposed = serializer.validated_data["proposed_starts_at"]
        proposed_duration = serializer.validated_data["proposed_duration_minutes"]
        partner = booking.swap.recipient if booking.swap.requester == request.user else booking.swap.requester
        evaluation = evaluate_time(
            request.user,
            partner,
            proposed,
            proposed_duration,
            exclude_booking_id=booking.id,
        )
        return Response(evaluation)


class BookingRescheduleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(
            Booking.objects.select_related("swap__requester", "swap__recipient"),
            pk=pk,
            status=Booking.Status.SCHEDULED,
        )
        if request.user not in {booking.swap.requester, booking.swap.recipient}:
            return Response({"detail": "You are not part of this booking."}, status=403)

        if booking.reschedule_requests.filter(status=RescheduleRequest.Status.PENDING).exists():
            return Response({"detail": "This booking already has a pending reschedule proposal."}, status=400)

        serializer = RescheduleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        proposed = serializer.validated_data["proposed_starts_at"]
        proposed_duration = serializer.validated_data["proposed_duration_minutes"]
        if proposed <= timezone.now():
            return Response({"detail": "Choose a future date and time."}, status=400)

        partner = booking.swap.recipient if booking.swap.requester == request.user else booking.swap.requester
        evaluation = evaluate_time(
            request.user,
            partner,
            proposed,
            proposed_duration,
            exclude_booking_id=booking.id,
        )
        if not evaluation["valid"]:
            return Response({"detail": "That time conflicts with availability.", "schedule_check": evaluation}, status=400)

        reschedule = serializer.save(booking=booking, requested_by=request.user)

        notify(
            partner,
            Notification.Kind.SESSION,
            f"{request.user.get_full_name() or request.user.username} proposed a new session time",
            proposed.strftime("%a %d %b · %H:%M"),
            actor=request.user,
            action_type="booking",
            target_id=booking.id,
            dedupe_key=f"booking-reschedule:{reschedule.id}",
        )
        return Response(RescheduleRequestSerializer(reschedule).data, status=201)


class BookingRescheduleActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        reschedule = get_object_or_404(
            RescheduleRequest.objects.select_related(
                "booking__swap__requester",
                "booking__swap__recipient",
                "requested_by",
            ),
            pk=pk,
        )
        booking = reschedule.booking
        if request.user not in {booking.swap.requester, booking.swap.recipient}:
            return Response({"detail": "You are not part of this booking."}, status=403)
        if reschedule.status != RescheduleRequest.Status.PENDING:
            return Response({"detail": "This reschedule request is no longer pending."}, status=400)

        if action == "accept":
            if request.user == reschedule.requested_by:
                return Response({"detail": "The other participant must accept the new time."}, status=400)

            evaluation = evaluate_time(
                booking.swap.requester,
                booking.swap.recipient,
                reschedule.proposed_starts_at,
                reschedule.proposed_duration_minutes,
                exclude_booking_id=booking.id,
            )
            if not evaluation["valid"]:
                return Response({"detail": "That time is no longer available.", "schedule_check": evaluation}, status=400)

            booking.starts_at = reschedule.proposed_starts_at
            booking.duration_minutes = reschedule.proposed_duration_minutes
            booking.mode = reschedule.proposed_mode
            booking.meeting_link = reschedule.proposed_meeting_link
            booking.location_note = reschedule.proposed_location_note
            if reschedule.note:
                booking.note = reschedule.note
            booking.save(update_fields=[
                "starts_at", "duration_minutes", "mode", "meeting_link",
                "location_note", "note", "updated_at",
            ])
            reschedule.status = RescheduleRequest.Status.ACCEPTED
            message = "New session time accepted"
        elif action == "decline":
            if request.user == reschedule.requested_by:
                return Response({"detail": "You cannot decline your own proposal."}, status=400)
            reschedule.status = RescheduleRequest.Status.DECLINED
            message = "Reschedule proposal declined"
        elif action == "cancel":
            if request.user != reschedule.requested_by:
                return Response({"detail": "Only the proposer can cancel this request."}, status=403)
            reschedule.status = RescheduleRequest.Status.CANCELLED
            message = "Reschedule proposal cancelled"
        else:
            return Response({"detail": "Unknown reschedule action."}, status=400)

        reschedule.save(update_fields=["status", "updated_at"])
        partner = booking.swap.recipient if booking.swap.requester == request.user else booking.swap.requester
        notify(
            partner,
            Notification.Kind.SESSION,
            message,
            booking.starts_at.strftime("%a %d %b · %H:%M"),
            actor=request.user,
            action_type="booking",
            target_id=booking.id,
            dedupe_key=f"booking-reschedule-action:{reschedule.id}:{action}",
        )
        return Response(BookingSerializer(booking, context={"request": request}).data)


class CalendarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from circles.models import CircleSession

        bookings = Booking.objects.filter(
            Q(swap__requester=request.user) | Q(swap__recipient=request.user)
        ).exclude(status=Booking.Status.CANCELLED).select_related(
            "swap__requester", "swap__recipient", "swap__offered_skill", "swap__requested_skill"
        )

        circle_sessions = CircleSession.objects.filter(
            circle__memberships__user=request.user
        ).select_related("circle").distinct()

        events = []
        for booking in bookings:
            partner = booking.swap.recipient if booking.swap.requester == request.user else booking.swap.requester
            learn_skill = booking.swap.requested_skill if booking.swap.requester == request.user else booking.swap.offered_skill
            teach_skill = booking.swap.offered_skill if booking.swap.requester == request.user else booking.swap.requested_skill
            events.append({
                "id": f"booking-{booking.id}",
                "event_type": "skillswap",
                "booking_id": booking.id,
                "title": f"{learn_skill.name} ↔ {teach_skill.name}",
                "subtitle": partner.get_full_name() or partner.username,
                "starts_at": booking.starts_at.isoformat(),
                "ends_at": (booking.starts_at + timedelta(minutes=booking.duration_minutes)).isoformat(),
                "duration_minutes": booking.duration_minutes,
                "mode": booking.mode,
                "meeting_link": booking.meeting_link,
                "location_note": booking.location_note,
                "status": booking.status,
            })

        for session in circle_sessions:
            events.append({
                "id": f"circle-{session.id}",
                "event_type": "circle",
                "circle_id": session.circle_id,
                "title": session.title,
                "subtitle": session.circle.title,
                "starts_at": session.starts_at.isoformat(),
                "ends_at": (session.starts_at + timedelta(minutes=session.duration_minutes)).isoformat(),
                "duration_minutes": session.duration_minutes,
                "mode": session.mode,
                "meeting_link": session.meeting_link,
                "location_note": session.location_note,
                "status": "scheduled",
            })

        events.sort(key=lambda event: event["starts_at"])
        return Response({"events": events})
