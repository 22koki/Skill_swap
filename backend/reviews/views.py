from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking
from users.models import Profile
from .models import Review
from .serializers import ReviewSerializer
from .services import update_reputation, reputation_badges

class ReviewCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking")
        booking = get_object_or_404(
            Booking.objects.select_related("swap__requester", "swap__recipient"),
            pk=booking_id,
        )
        swap = booking.swap

        if request.user not in {swap.requester, swap.recipient}:
            return Response({"detail": "You are not part of this SkillSwap."}, status=403)

        if booking.status != Booking.Status.COMPLETED:
            return Response({"detail": "You can review a SkillSwap after the session is completed."}, status=400)

        if Review.objects.filter(booking=booking, reviewer=request.user).exists():
            return Response({"detail": "You already reviewed this session."}, status=400)

        reviewee = swap.recipient if swap.requester == request.user else swap.requester
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save(reviewer=request.user, reviewee=reviewee)
        update_reputation(reviewee)

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

class MyReviewsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        written = Review.objects.filter(reviewer=request.user).select_related("reviewer", "reviewee", "booking")
        received = Review.objects.filter(reviewee=request.user).select_related("reviewer", "reviewee", "booking")
        return Response({
            "written": ReviewSerializer(written, many=True).data,
            "received": ReviewSerializer(received, many=True).data,
        })

class UserReputationView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        profile = get_object_or_404(Profile.objects.select_related("user"), user_id=user_id)
        reviews = Review.objects.filter(reviewee_id=user_id).select_related("reviewer").order_by("-created_at")[:8]
        return Response({
            "user_id": user_id,
            "name": profile.user.get_full_name() or profile.user.username,
            "average_rating": float(profile.average_rating),
            "review_count": profile.review_count,
            "teaching_rating": float(profile.teaching_rating),
            "communication_rating": float(profile.communication_rating),
            "reliability_rating": float(profile.reliability_rating),
            "friendliness_rating": float(profile.friendliness_rating),
            "would_swap_again_percent": profile.would_swap_again_percent,
            "completed_swaps": profile.completed_swaps,
            "badges": reputation_badges(profile),
            "recent_reviews": ReviewSerializer(reviews, many=True).data,
        })
