from datetime import timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from skills.models import Skill
from swaps.models import Swap
from .models import Booking


class BookingPermissionTests(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="booking-alice")
        self.bob = User.objects.create_user(username="booking-bob")
        self.stranger = User.objects.create_user(username="booking-stranger")
        skill_a = Skill.objects.create(name="Security test Python")
        skill_b = Skill.objects.create(name="Security test Photography")
        self.swap = Swap.objects.create(
            requester=self.alice, recipient=self.bob,
            offered_skill=skill_a, requested_skill=skill_b, status=Swap.Status.ACCEPTED
        )
        self.second_swap = Swap.objects.create(
            requester=self.alice, recipient=self.bob,
            offered_skill=skill_a, requested_skill=skill_b, status=Swap.Status.ACCEPTED
        )
        self.booking = Booking.objects.create(
            swap=self.swap, starts_at=timezone.now() + timedelta(days=1),
            duration_minutes=60, status=Booking.Status.SCHEDULED
        )
        self.client = APIClient()

    def test_nonparticipant_cannot_view_or_modify_booking(self):
        self.client.force_authenticate(user=self.stranger)
        self.assertEqual(self.client.get("/api/bookings/").data, [])
        self.assertEqual(self.client.get(f"/api/bookings/{self.booking.pk}/").status_code, 404)
        self.assertEqual(self.client.patch(
            f"/api/bookings/{self.booking.pk}/", {"note": "Not mine"}, format="json"
        ).status_code, 404)
        self.assertEqual(self.client.post(
            f"/api/bookings/{self.booking.pk}/complete/"
        ).status_code, 403)

    def test_booking_cannot_be_moved_to_another_swap(self):
        self.client.force_authenticate(user=self.alice)
        result = self.client.patch(
            f"/api/bookings/{self.booking.pk}/",
            {"swap": self.second_swap.pk}, format="json"
        )
        self.assertEqual(result.status_code, 400)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.swap_id, self.swap.pk)

    def test_future_session_cannot_be_marked_complete(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(f"/api/bookings/{self.booking.pk}/complete/")
        self.assertEqual(response.status_code, 400)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.Status.SCHEDULED)

    def test_cancelled_session_cannot_be_completed(self):
        self.client.force_authenticate(user=self.alice)
        self.assertEqual(
            self.client.post(f"/api/bookings/{self.booking.pk}/cancel/").status_code, 200
        )
        self.assertEqual(
            self.client.post(f"/api/bookings/{self.booking.pk}/complete/").status_code, 400
        )
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, Booking.Status.CANCELLED)
        self.assertEqual(self.swap.status, Swap.Status.ACCEPTED)
