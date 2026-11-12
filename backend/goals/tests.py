from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from .models import LearningGoal, Milestone


class LearningGoalTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="goal-owner")
        self.other = User.objects.create_user(username="other-owner")
        self.client = APIClient()
        self.client.force_authenticate(user=self.owner)

    def test_goal_create_and_milestone_progress(self):
        response = self.client.post("/api/goals/", {"title": "Learn React", "target_date": "2026-12-20"}, format="json")
        self.assertEqual(response.status_code, 201)
        goal_id = response.data["id"]
        response = self.client.post(f"/api/goals/{goal_id}/milestones/", {"title": "Build components"}, format="json")
        self.assertEqual(response.status_code, 201)
        milestone_id = response.data["id"]
        response = self.client.patch(f"/api/goals/{goal_id}/milestones/{milestone_id}/", {"is_done": True}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(Milestone.objects.get(pk=milestone_id).completed_at)
        self.assertEqual(self.client.get(f"/api/goals/{goal_id}/").data["progress"], 100)

    def test_goal_and_milestone_owner_isolation(self):
        foreign = LearningGoal.objects.create(owner=self.other, title="Private")
        milestone = Milestone.objects.create(goal=foreign, title="Secret")
        self.assertEqual(self.client.get(f"/api/goals/{foreign.id}/").status_code, 404)
        self.assertEqual(self.client.patch(f"/api/goals/{foreign.id}/milestones/{milestone.id}/", {"is_done": True}, format="json").status_code, 404)
        self.assertEqual(self.client.post(f"/api/goals/{foreign.id}/milestones/", {"title": "Intrusion"}, format="json").status_code, 404)

    def test_authentication_required(self):
        self.client.force_authenticate(user=None)
        self.assertIn(self.client.get("/api/goals/").status_code, (401, 403))

    def test_goal_status_update_and_delete(self):
        goal = LearningGoal.objects.create(owner=self.owner, title="Photography")
        self.assertEqual(self.client.patch(f"/api/goals/{goal.id}/", {"status": "paused"}, format="json").status_code, 200)
        self.assertEqual(self.client.delete(f"/api/goals/{goal.id}/").status_code, 204)
