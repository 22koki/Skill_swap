from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from skills.models import Skill
from swaps.models import Swap
from users.models import UserBlock
from .models import Message


class PrivateConversationTests(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="message-alice")
        self.bob = User.objects.create_user(username="message-bob")
        self.stranger = User.objects.create_user(username="message-stranger")
        skill_a = Skill.objects.create(name="Messaging test Python")
        skill_b = Skill.objects.create(name="Messaging test Design")
        self.swap = Swap.objects.create(
            requester=self.alice, recipient=self.bob,
            offered_skill=skill_a, requested_skill=skill_b,
            status=Swap.Status.ACCEPTED,
        )
        self.client = APIClient()

    def test_outsider_cannot_read_or_send_private_messages(self):
        self.client.force_authenticate(user=self.stranger)
        route = f"/api/messages/swaps/{self.swap.pk}/"
        self.assertEqual(self.client.get(route).status_code, 403)
        self.assertEqual(self.client.post(route, {"body": "Intrusion"}, format="json").status_code, 403)
        self.assertEqual(Message.objects.count(), 0)

    def test_blocks_prevent_new_private_messages(self):
        self.client.force_authenticate(user=self.alice)
        route = f"/api/messages/swaps/{self.swap.pk}/"
        self.assertEqual(self.client.post(route, {"body": "Before blocking"}, format="json").status_code, 201)
        UserBlock.objects.create(blocker=self.bob, blocked=self.alice)
        self.assertEqual(self.client.get(route).status_code, 403)
        self.assertEqual(self.client.post(route, {"body": "After blocking"}, format="json").status_code, 403)
        self.assertEqual(Message.objects.count(), 1)
