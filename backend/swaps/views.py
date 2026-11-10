from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Swap
from .serializers import SwapSerializer

class SwapListCreateView(generics.ListCreateAPIView):
    serializer_class = SwapSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Swap.objects.filter(
            Q(requester=self.request.user) | Q(recipient=self.request.user)
        ).select_related("requester", "recipient", "offered_skill", "requested_skill")

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)

class SwapActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        swap = get_object_or_404(Swap, pk=pk)

        if action in {"accept", "decline"} and swap.recipient != request.user:
            return Response({"detail": "Only the recipient can do that."}, status=403)

        if action == "cancel" and swap.requester != request.user:
            return Response({"detail": "Only the requester can cancel this proposal."}, status=403)

        transitions = {
            "accept": (Swap.Status.PROPOSED, Swap.Status.ACCEPTED),
            "decline": (Swap.Status.PROPOSED, Swap.Status.DECLINED),
            "cancel": (Swap.Status.PROPOSED, Swap.Status.CANCELLED),
            "complete": (Swap.Status.ACCEPTED, Swap.Status.COMPLETED),
        }

        if action not in transitions:
            return Response({"detail": "Unknown action."}, status=400)

        required, target = transitions[action]

        if action == "complete" and request.user not in {swap.requester, swap.recipient}:
            return Response({"detail": "You are not part of this swap."}, status=403)

        if swap.status != required:
            return Response({"detail": f"Swap must be {required} before this action."}, status=400)

        swap.status = target
        swap.save(update_fields=["status", "updated_at"])
        return Response(SwapSerializer(swap).data)
