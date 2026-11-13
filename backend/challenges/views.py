from django.db import IntegrityError, transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.safety import restriction_reason

from .catalog import BY_SLUG
from .models import ChallengeEnrollment
from .services import challenges_dashboard


class ChallengeDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(challenges_dashboard(request.user))


class ChallengeJoinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        if slug not in BY_SLUG:
            return Response({"detail": "Challenge not found."}, status=404)
        reason = restriction_reason(request.user)
        if reason:
            return Response({"detail": reason}, status=403)
        with transaction.atomic():
            _, created = ChallengeEnrollment.objects.get_or_create(user=request.user, slug=slug)
        data = challenges_dashboard(request.user)
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
