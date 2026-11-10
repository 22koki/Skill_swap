from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from swaps.models import Swap
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

ALLOWED_CHAT_STATUSES = {"accepted", "completed"}

def user_is_participant(user, swap):
    return user in {swap.requester, swap.recipient}

class ConversationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(
            Q(swap__requester=request.user) | Q(swap__recipient=request.user)
        ).select_related(
            "swap", "swap__requester", "swap__recipient",
            "swap__offered_skill", "swap__requested_skill"
        ).prefetch_related("messages")
        return Response(ConversationSerializer(conversations, many=True, context={"request": request}).data)

class SwapConversationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_swap(self, request, swap_id):
        swap = get_object_or_404(
            Swap.objects.select_related("requester", "recipient", "offered_skill", "requested_skill"),
            pk=swap_id
        )
        if not user_is_participant(request.user, swap):
            return None
        return swap

    def get(self, request, swap_id):
        swap = self.get_swap(request, swap_id)
        if not swap:
            return Response({"detail": "You are not part of this swap."}, status=403)

        if swap.status not in ALLOWED_CHAT_STATUSES:
            return Response({"detail": "Chat opens after a swap is accepted."}, status=400)

        conversation, _ = Conversation.objects.get_or_create(swap=swap)
        conversation.messages.exclude(sender=request.user).filter(read_at__isnull=True).update(read_at=timezone.now())

        messages = conversation.messages.select_related("sender", "sender__profile")
        return Response({
            "conversation": ConversationSerializer(conversation, context={"request": request}).data,
            "messages": MessageSerializer(messages, many=True).data,
        })

    def post(self, request, swap_id):
        swap = self.get_swap(request, swap_id)
        if not swap:
            return Response({"detail": "You are not part of this swap."}, status=403)

        if swap.status not in ALLOWED_CHAT_STATUSES:
            return Response({"detail": "Chat opens after a swap is accepted."}, status=400)

        body = str(request.data.get("body", "")).strip()
        if not body:
            return Response({"detail": "Message cannot be empty."}, status=400)
        if len(body) > 2000:
            return Response({"detail": "Message is too long."}, status=400)

        conversation, _ = Conversation.objects.get_or_create(swap=swap)
        message = Message.objects.create(conversation=conversation, sender=request.user, body=body)
        conversation.save(update_fields=["updated_at"])
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
