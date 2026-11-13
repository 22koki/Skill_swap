from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient


class SessionRevocationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="session-check", password="sample-pass-123")
        self.other = User.objects.create_user(username="session-other", password="sample-pass-123")
        self.client = APIClient()

    def login(self, username="session-check"):
        response = self.client.post(
            "/api/auth/login/",
            {"username": username, "password": "sample-pass-123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        return response.data

    def test_refresh_rotation_invalidates_original_token(self):
        credentials = self.login()
        original = credentials["refresh"]
        rotated = self.client.post(
            "/api/auth/token/refresh/", {"refresh": original}, format="json"
        )
        self.assertEqual(rotated.status_code, 200)
        self.assertIn("refresh", rotated.data)
        self.assertNotEqual(rotated.data["refresh"], original)
        reused = self.client.post(
            "/api/auth/token/refresh/", {"refresh": original}, format="json"
        )
        self.assertEqual(reused.status_code, 401)
        self.assertEqual(
            self.client.post(
                "/api/auth/token/refresh/", {"refresh": rotated.data["refresh"]}, format="json"
            ).status_code, 200
        )

    def test_logout_revokes_the_refresh_token(self):
        credentials = self.login()
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + credentials["access"])
        response = self.client.post(
            "/api/auth/logout/", {"refresh": credentials["refresh"]}, format="json"
        )
        self.assertEqual(response.status_code, 204)
        self.client.credentials()
        self.assertEqual(
            self.client.post(
                "/api/auth/token/refresh/", {"refresh": credentials["refresh"]}, format="json"
            ).status_code, 401
        )

    def test_user_cannot_revoke_another_users_refresh_token(self):
        alice = self.login()
        bob = self.login("session-other")
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + alice["access"])
        result = self.client.post("/api/auth/logout/", {"refresh": bob["refresh"]}, format="json")
        self.assertEqual(result.status_code, 403)
        self.client.credentials()
        self.assertEqual(
            self.client.post(
                "/api/auth/token/refresh/", {"refresh": bob["refresh"]}, format="json"
            ).status_code, 200
        )

    def test_logout_rejects_unauthenticated_requests(self):
        credentials = self.login()
        self.assertEqual(
            self.client.post(
                "/api/auth/logout/", {"refresh": credentials["refresh"]}, format="json"
            ).status_code, 401
        )
