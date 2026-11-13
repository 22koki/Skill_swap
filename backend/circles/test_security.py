from datetime import timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import CircleMember, CircleSession, SkillCircle


class CirclePrivacyTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="circle-owner")
        self.stranger = User.objects.create_user(username="circle-stranger")
        self.private = SkillCircle.objects.create(title="Hidden study group", created_by=self.owner, is_public=False)
        self.public = SkillCircle.objects.create(title="Public study group", created_by=self.owner, is_public=True)
        CircleMember.objects.create(circle=self.private, user=self.owner, role=CircleMember.Role.MENTOR)
        CircleMember.objects.create(circle=self.public, user=self.owner, role=CircleMember.Role.MENTOR)
        CircleSession.objects.create(
            circle=self.public, title="Member meeting", created_by=self.owner,
            starts_at=timezone.now() + timedelta(days=1),
            meeting_link="https://example.com/private-meeting"
        )
        self.client = APIClient()

    def test_private_circle_not_visible_to_unrelated_account(self):
        self.client.force_authenticate(user=self.stranger)
        response = self.client.get("/api/circles/")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(self.private.pk, [x["id"] for x in response.data])
        self.assertEqual(self.client.get(f"/api/circles/{self.private.pk}/").status_code, 403)
        self.assertEqual(self.client.post(f"/api/circles/{self.private.pk}/join/").status_code, 403)

    def test_public_circle_preview_hides_member_only_details(self):
        response = self.client.get(f"/api/circles/{self.public.pk}/")
        self.assertEqual(response.status_code, 200)
        for key in ("sessions", "tasks", "resources", "next_session", "ai_plan"):
            self.assertNotIn(key, response.data)

    def test_self_join_cannot_grant_mentor_role(self):
        self.client.force_authenticate(user=self.stranger)
        response = self.client.post(f"/api/circles/{self.public.pk}/join/", {"role": "mentor"}, format="json")
        self.assertEqual(response.status_code, 200)
        membership = CircleMember.objects.get(circle=self.public, user=self.stranger)
        self.assertEqual(membership.role, CircleMember.Role.LEARNER)
        self.client.post(f"/api/circles/{self.public.pk}/join/", {"role": "mentor"}, format="json")
        membership.refresh_from_db()
        self.assertEqual(membership.role, CircleMember.Role.LEARNER)

    def test_circle_creator_still_has_member_content(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(f"/api/circles/{self.public.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["sessions"][0]["meeting_link"], "https://example.com/private-meeting")
