from datetime import timedelta
from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from community.models import Post
from goals.models import LearningGoal, Milestone

from .models import ChallengeEnrollment
from .services import learning_streak
from users.progression import build_progression


class ChallengeTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="learner")
        self.other = User.objects.create_user(username="other")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_join_is_idempotent(self):
        path = "/api/challenges/consistent-learner/join/"
        self.assertEqual(self.client.post(path).status_code, 201)
        self.assertEqual(self.client.post(path).status_code, 200)
        self.assertEqual(ChallengeEnrollment.objects.filter(user=self.user).count(), 1)

    def test_milestones_count_only_after_join(self):
        goal = LearningGoal.objects.create(owner=self.user, title="Learn")
        old = Milestone.objects.create(goal=goal, title="Old", is_done=True, completed_at=timezone.now()-timedelta(days=2))
        self.client.post("/api/challenges/milestone-momentum/join/")
        new = Milestone.objects.create(goal=goal, title="New", is_done=True, completed_at=timezone.now())
        res = self.client.get("/api/challenges/")
        item = next(x for x in res.data["challenges"] if x["slug"] == "milestone-momentum")
        self.assertEqual(item["progress"], 1)

    def test_project_challenge_and_user_isolation(self):
        self.client.post("/api/challenges/project-showcase/join/")
        Post.objects.create(author=self.other, kind="project", body="Other project")
        Post.objects.create(author=self.user, kind="project", body="My project")
        data = self.client.get("/api/challenges/").data
        item = next(x for x in data["challenges"] if x["slug"] == "project-showcase")
        self.assertEqual(item["progress"], 1)

    def test_streak_uses_distinct_calendar_days(self):
        Post.objects.create(author=self.user, body="Today")
        Post.objects.create(author=self.user, body="Second post today")
        dates = learning_streak(self.user)
        self.assertEqual(dates["current"], 1)
        self.assertEqual(dates["active_days"], 1)

    def test_completed_challenge_unlocks_badge_once(self):
        self.client.post("/api/challenges/milestone-momentum/join/")
        goal = LearningGoal.objects.create(owner=self.user, title="My roadmap")
        for number in range(5):
            Milestone.objects.create(goal=goal, title=f"Step {number}", is_done=True, completed_at=timezone.now())
        result = self.client.get("/api/challenges/").data
        item = next(x for x in result["challenges"] if x["slug"] == "milestone-momentum")
        self.assertEqual(item["state"], "completed")
        self.assertEqual(item["progress"], 5)
        self.assertEqual(result["completed_challenges"], 1)
        self.assertEqual(result["earned_xp"], 150)
        self.assertEqual(result["badges"][0]["name"], "Goal Getter")

    def test_inactive_challenge_has_zero_progress(self):
        Post.objects.create(author=self.user, kind="project", body="Before signing up")
        data = self.client.get("/api/challenges/").data
        item = next(x for x in data["challenges"] if x["slug"] == "project-showcase")
        self.assertEqual(item["state"], "available")
        self.assertEqual(item["progress"], 0)

    def test_challenge_xp_counts_once_in_passport_and_levels(self):
        baseline = build_progression(self.user)
        self.client.post("/api/challenges/milestone-momentum/join/")
        goal = LearningGoal.objects.create(owner=self.user, title="Learn React")
        for number in range(5):
            Milestone.objects.create(
                goal=goal, title=f"Step {number}",
                is_done=True, completed_at=timezone.now()
            )
        first = build_progression(self.user)
        second = build_progression(self.user)
        self.assertEqual(first["challenge_xp"], 150)
        self.assertEqual(first["xp"] - baseline["xp"], 150)
        self.assertEqual(first["xp"], second["xp"])
        self.assertEqual(first["completed_challenges"], 1)
        self.assertEqual(first["challenge_badges"], [{"name": "Goal Getter", "icon": "🎯"}])
        self.assertEqual(len([a for a in first["unlocked"] if a["key"] == "challenge-milestone-momentum"]), 1)
        self.assertEqual(
            self.client.get(f"/api/auth/passports/{self.user.id}/").status_code,
            200,
        )

    def test_challenges_not_awarded_before_enrolling(self):
        goal = LearningGoal.objects.create(owner=self.user, title="Earlier progress")
        for i in range(5):
            Milestone.objects.create(goal=goal, title=f"Earlier {i}", is_done=True, completed_at=timezone.now())
        result = build_progression(self.user)
        self.assertEqual(result["challenge_xp"], 0)
        self.assertFalse(any(a["key"] == "challenge-milestone-momentum" for a in result["unlocked"]))

    def test_auth_and_unknown_challenge(self):
        self.assertEqual(self.client.post("/api/challenges/not-a-challenge/join/").status_code, 404)
        self.client.force_authenticate(user=None)
        self.assertIn(self.client.get("/api/challenges/").status_code, (401, 403))
