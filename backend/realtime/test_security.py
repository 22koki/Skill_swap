from asgiref.sync import async_to_sync
from django.contrib.auth.models import User
from django.test import TransactionTestCase

from circles.models import CircleMember, CircleMessage, SkillCircle
from messaging.models import Message
from skills.models import Skill
from swaps.models import Swap
from users.models import UserBlock
from .consumers import create_direct_message, create_circle_message


class RealTimeMessagePermissionTests(TransactionTestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="websocket-alice")
        self.bob = User.objects.create_user(username="websocket-bob")
        self.stranger = User.objects.create_user(username="websocket-stranger")
        skill_a = Skill.objects.create(name="Realtime test Python")
        skill_b = Skill.objects.create(name="Realtime test Design")
        self.swap = Swap.objects.create(
            requester=self.alice, recipient=self.bob,
            offered_skill=skill_a, requested_skill=skill_b, status=Swap.Status.ACCEPTED
        )
        self.circle = SkillCircle.objects.create(title="Realtime test Circle", created_by=self.alice)
        CircleMember.objects.create(circle=self.circle, user=self.alice, role=CircleMember.Role.MENTOR)

    def test_direct_websocket_helper_rejects_outsider_and_revoked_swap(self):
        self.assertEqual(async_to_sync(create_direct_message)(
            self.swap.pk, self.stranger, "Not a participant"
        ), (None, None))
        self.assertFalse(Message.objects.exists())
        self.swap.status = Swap.Status.CANCELLED
        self.swap.save(update_fields=["status"])
        self.assertEqual(async_to_sync(create_direct_message)(
            self.swap.pk, self.alice, "After cancellation"
        ), (None, None))
        self.assertFalse(Message.objects.exists())

    def test_direct_websocket_helper_rejects_blocked_participant(self):
        UserBlock.objects.create(blocker=self.bob, blocked=self.alice)
        self.assertEqual(async_to_sync(create_direct_message)(
            self.swap.pk, self.alice, "Blocked"
        ), (None, None))
        self.assertFalse(Message.objects.exists())

    def test_circle_websocket_helper_rejects_nonmember(self):
        self.assertIsNone(async_to_sync(create_circle_message)(
            self.circle.pk, self.stranger, "Secret message"
        ))
        self.assertFalse(CircleMessage.objects.exists())
