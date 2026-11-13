from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase
from unittest.mock import patch
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from users.models import Profile, UserBlock


class PublicProfilePrivacyTests(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="privacy-alice", email="private@example.com", password="pass12345")
        Profile.objects.get_or_create(user=self.alice)
        self.bob = User.objects.create_user(username="privacy-bob")
        self.client = APIClient()

    def test_public_profile_excludes_email_and_staff(self):
        response = self.client.get(f"/api/auth/profiles/{self.alice.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], self.alice.username)
        self.assertNotIn("email", response.data)
        self.assertNotIn("is_staff", response.data)

    def test_blocked_user_cannot_open_profile(self):
        UserBlock.objects.create(blocker=self.alice, blocked=self.bob)
        self.client.force_authenticate(user=self.bob)
        self.assertEqual(self.client.get(f"/api/auth/profiles/{self.alice.pk}/").status_code, 403)


class AuthThrottleTests(TestCase):
    def test_login_rate_limited_after_two_attempts(self):
        # ScopedRateThrottle caches DEFAULT_THROTTLE_RATES at import time.
        # Patching REST_FRAMEWORK with override_settings alone may therefore
        # leave the actual throttle at its production default of 10/min.
        with patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"auth_login": "2/min"}):
            cache.clear()
            client = APIClient()
            try:
                codes = [
                    client.post("/api/auth/login/", {"username": "no-account", "password": "wrong"}, format="json").status_code
                    for _ in range(3)
                ]
                self.assertEqual(codes, [401, 401, 429])
            finally:
                cache.clear()
