from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.db.models import F
from django.utils import timezone

from messaging.models import Conversation, Message, UserPresence
from notifications.models import Notification
from notifications.services import notify
from swaps.models import Swap
from circles.models import SkillCircle, CircleMember, CircleMessage
from users.safety import interaction_block_reason, is_blocked_between


@database_sync_to_async
def presence_connect(user):
    presence, _ = UserPresence.objects.get_or_create(user=user)
    UserPresence.objects.filter(pk=presence.pk).update(connection_count=F("connection_count") + 1)
    presence.refresh_from_db()
    return presence.connection_count


@database_sync_to_async
def presence_disconnect(user):
    presence, _ = UserPresence.objects.get_or_create(user=user)
    next_count = max(0, presence.connection_count - 1)
    presence.connection_count = next_count
    if next_count == 0:
        presence.last_seen = timezone.now()
    presence.save(update_fields=["connection_count", "last_seen"])
    return next_count, presence.last_seen.isoformat() if presence.last_seen else None


@database_sync_to_async
def can_view_presence(viewer, subject_id):
    if viewer.id == subject_id:
        return True
    from django.contrib.auth import get_user_model
    subject = get_user_model().objects.filter(pk=subject_id).first()
    if not subject:
        return False
    return not is_blocked_between(viewer, subject)


@database_sync_to_async
def presence_payload(user_id):
    try:
        presence = UserPresence.objects.get(user_id=user_id)
        return {
            "user_id": user_id,
            "online": presence.connection_count > 0,
            "last_seen": presence.last_seen.isoformat() if presence.last_seen else None,
        }
    except UserPresence.DoesNotExist:
        return {"user_id": user_id, "online": False, "last_seen": None}


@database_sync_to_async
def get_swap_for_user(swap_id, user):
    try:
        swap = Swap.objects.select_related(
            "requester", "recipient", "offered_skill", "requested_skill"
        ).get(pk=swap_id)
    except Swap.DoesNotExist:
        return None
    if user not in {swap.requester, swap.recipient} or swap.status not in {"accepted", "completed"}:
        return None
    partner = swap.recipient if swap.requester_id == user.id else swap.requester
    if interaction_block_reason(user, partner):
        return None
    return swap


@database_sync_to_async
def create_direct_message(swap_id, user, body):
    try:
        swap = Swap.objects.select_related("requester", "recipient").get(pk=swap_id)
    except Swap.DoesNotExist:
        return None, None
    if user.id not in (swap.requester_id, swap.recipient_id) or swap.status not in ("accepted", "completed"):
        return None, None
    recipient = swap.recipient if swap.requester_id == user.id else swap.requester
    if interaction_block_reason(user, recipient):
        return None, None
    conversation, _ = Conversation.objects.get_or_create(swap=swap)
    recipient_presence = UserPresence.objects.filter(user=recipient).first()
    delivered_at = timezone.now() if recipient_presence and recipient_presence.connection_count > 0 else None
    message = Message.objects.create(
        conversation=conversation,
        sender=user,
        body=body,
        delivered_at=delivered_at,
    )
    conversation.save(update_fields=["updated_at"])

    profile = getattr(user, "profile", None)
    payload = {
        "id": message.id,
        "sender": user.id,
        "sender_name": user.get_full_name() or user.username,
        "sender_avatar_url": profile.avatar_url if profile else "",
        "body": message.body,
        "created_at": message.created_at.isoformat(),
        "delivered_at": message.delivered_at.isoformat() if message.delivered_at else None,
        "read_at": None,
    }

    notify(
        recipient,
        Notification.Kind.MESSAGE,
        f"New message from {user.get_full_name() or user.username}",
        body[:120],
        actor=user,
        action_type="message",
        target_id=swap.id,
        dedupe_key=f"message:{message.id}",
    )
    return payload, recipient.id


@database_sync_to_async
def mark_direct_read(swap_id, user):
    try:
        conversation = Conversation.objects.select_related("swap__requester", "swap__recipient").get(swap_id=swap_id)
    except Conversation.DoesNotExist:
        return []
    swap = conversation.swap
    if user.id not in (swap.requester_id, swap.recipient_id) or swap.status not in ("accepted", "completed"):
        return []
    partner = swap.recipient if swap.requester_id == user.id else swap.requester
    if interaction_block_reason(user, partner):
        return []
    qs = conversation.messages.exclude(sender=user).filter(read_at__isnull=True)
    ids = list(qs.values_list("id", flat=True))
    if ids:
        qs.update(read_at=timezone.now())
    return ids


@database_sync_to_async
def get_circle_for_user(circle_id, user):
    try:
        circle = SkillCircle.objects.get(pk=circle_id)
    except SkillCircle.DoesNotExist:
        return None
    if not CircleMember.objects.filter(circle=circle, user=user).exists():
        return None
    return circle


@database_sync_to_async
def create_circle_message(circle_id, user, body):
    try:
        circle = SkillCircle.objects.select_related("created_by").get(pk=circle_id)
    except SkillCircle.DoesNotExist:
        return None
    membership = CircleMember.objects.filter(circle=circle, user=user).first()
    if not membership or membership.is_muted or interaction_block_reason(user, circle.created_by):
        return None
    message = CircleMessage.objects.create(circle=circle, sender=user, body=body)
    profile = getattr(user, "profile", None)
    return {
        "id": message.id,
        "sender_id": user.id,
        "sender_name": user.get_full_name() or user.username,
        "sender_avatar_url": profile.avatar_url if profile else "",
        "body": message.body,
        "created_at": message.created_at.isoformat(),
    }


class ActivityConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        self.user = user
        self.user_group = f"user_{user.id}"
        self.presence_group = "presence_all"

        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.channel_layer.group_add(self.presence_group, self.channel_name)
        await self.accept(subprotocol="skillswap" if "skillswap" in self.scope.get("subprotocols", []) else None)

        await presence_connect(user)
        await self.channel_layer.group_send(
            self.presence_group,
            {
                "type": "presence_event",
                "presence": {"user_id": user.id, "online": True, "last_seen": None},
            },
        )

    async def disconnect(self, code):
        if not hasattr(self, "user"):
            return
        count, last_seen = await presence_disconnect(self.user)
        await self.channel_layer.group_discard(self.user_group, self.channel_name)
        await self.channel_layer.group_discard(self.presence_group, self.channel_name)
        if count == 0:
            await self.channel_layer.group_send(
                self.presence_group,
                {
                    "type": "presence_event",
                    "presence": {
                        "user_id": self.user.id,
                        "online": False,
                        "last_seen": last_seen,
                    },
                },
            )

    async def receive_json(self, content, **kwargs):
        event = content.get("event")
        if event == "presence_query":
            try:
                user_id = int(content.get("user_id") or 0)
            except (ValueError, TypeError):
                return
            if user_id and await can_view_presence(self.user, user_id):
                await self.send_json({
                    "event": "presence",
                    "presence": await presence_payload(user_id),
                })

    async def notification_event(self, event):
        await self.send_json({"event": "notification", "notification": event["notification"]})

    async def presence_event(self, event):
        subject_id = event["presence"]["user_id"]
        if await can_view_presence(self.user, subject_id):
            await self.send_json({"event": "presence", "presence": event["presence"]})


class DirectChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        self.user = user
        self.swap_id = int(self.scope["url_route"]["kwargs"]["swap_id"])
        swap = await get_swap_for_user(self.swap_id, user)
        if not swap:
            await self.close(code=4403)
            return

        self.group_name = f"chat_{self.swap_id}"
        self.partner_id = swap.recipient_id if swap.requester_id == user.id else swap.requester_id
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept(subprotocol="skillswap" if "skillswap" in self.scope.get("subprotocols", []) else None)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat_presence_event",
                "user_id": user.id,
                "online": True,
            },
        )
        ids = await mark_direct_read(self.swap_id, user)
        if ids:
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat_read_event", "reader_id": user.id, "message_ids": ids},
            )

    async def disconnect(self, code):
        if not hasattr(self, "group_name"):
            return
        # Global activity presence is authoritative. Closing only this chat
        # must not make the user appear offline across SkillSwap.
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event = content.get("event")
        if event not in {"message", "typing", "read"}:
            return
        if not await get_swap_for_user(self.swap_id, self.user):
            await self.close(code=4403)
            return
        if event == "message":
            body = str(content.get("body", "")).strip()
            if not body or len(body) > 2000:
                return
            message, _ = await create_direct_message(self.swap_id, self.user, body)
            if message:
                await self.channel_layer.group_send(
                    self.group_name,
                    {"type": "chat_message_event", "message": message},
                )
            else:
                await self.send_json({"event": "blocked", "detail": "This chat is no longer available."})
        elif event == "typing":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat_typing_event",
                    "user_id": self.user.id,
                    "typing": bool(content.get("typing")),
                },
            )
        elif event == "read":
            ids = await mark_direct_read(self.swap_id, self.user)
            if ids:
                await self.channel_layer.group_send(
                    self.group_name,
                    {"type": "chat_read_event", "reader_id": self.user.id, "message_ids": ids},
                )

    async def chat_message_event(self, event):
        if not await get_swap_for_user(self.swap_id, self.user):
            await self.close(code=4403)
            return
        await self.send_json({"event": "message", "message": event["message"]})

    async def chat_typing_event(self, event):
        if not await get_swap_for_user(self.swap_id, self.user):
            await self.close(code=4403)
            return
        if event["user_id"] != self.user.id:
            await self.send_json({
                "event": "typing",
                "user_id": event["user_id"],
                "typing": event["typing"],
            })

    async def chat_read_event(self, event):
        if not await get_swap_for_user(self.swap_id, self.user):
            await self.close(code=4403)
            return
        await self.send_json({
            "event": "read",
            "reader_id": event["reader_id"],
            "message_ids": event["message_ids"],
            "read_at": timezone.now().isoformat(),
        })

    async def chat_presence_event(self, event):
        if not await get_swap_for_user(self.swap_id, self.user):
            await self.close(code=4403)
            return
        if event["user_id"] != self.user.id:
            await self.send_json({
                "event": "presence",
                "user_id": event["user_id"],
                "online": event["online"],
            })


class CircleChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        self.user = user
        self.circle_id = int(self.scope["url_route"]["kwargs"]["circle_id"])
        circle = await get_circle_for_user(self.circle_id, user)
        if not circle:
            await self.close(code=4403)
            return

        self.group_name = f"circle_{self.circle_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept(subprotocol="skillswap" if "skillswap" in self.scope.get("subprotocols", []) else None)

        await self.channel_layer.group_send(
            self.group_name,
            {"type": "circle_presence_event", "user_id": user.id, "online": True},
        )

    async def disconnect(self, code):
        if not hasattr(self, "group_name"):
            return
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "circle_presence_event", "user_id": self.user.id, "online": False},
        )
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event = content.get("event")
        if event not in {"message", "typing"}:
            return
        if not await get_circle_for_user(self.circle_id, self.user):
            await self.close(code=4403)
            return
        if event == "message":
            body = str(content.get("body", "")).strip()
            if not body or len(body) > 3000:
                return
            message = await create_circle_message(self.circle_id, self.user, body)
            if message:
                await self.channel_layer.group_send(
                    self.group_name,
                    {"type": "circle_message_event", "message": message},
                )
        elif event == "typing":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "circle_typing_event",
                    "user_id": self.user.id,
                    "user_name": self.user.get_full_name() or self.user.username,
                    "typing": bool(content.get("typing")),
                },
            )

    async def circle_message_event(self, event):
        if not await get_circle_for_user(self.circle_id, self.user):
            await self.close(code=4403)
            return
        await self.send_json({"event": "message", "message": event["message"]})

    async def circle_typing_event(self, event):
        if not await get_circle_for_user(self.circle_id, self.user):
            await self.close(code=4403)
            return
        if event["user_id"] != self.user.id:
            await self.send_json({
                "event": "typing",
                "user_id": event["user_id"],
                "user_name": event["user_name"],
                "typing": event["typing"],
            })

    async def circle_presence_event(self, event):
        if not await get_circle_for_user(self.circle_id, self.user):
            await self.close(code=4403)
            return
        await self.send_json({
            "event": "presence",
            "user_id": event["user_id"],
            "online": event["online"],
        })
