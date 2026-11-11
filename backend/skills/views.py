from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import Profile
from users.matching import build_match_data
from .models import Skill, SkillCategory, UserSkill
from .serializers import SkillSerializer, SkillCategorySerializer, UserSkillSerializer

class SkillListView(generics.ListAPIView):
    serializer_class = SkillSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Skill.objects.select_related("category")
        query = self.request.query_params.get("q", "").strip()
        if query:
            queryset = queryset.filter(Q(name__icontains=query) | Q(description__icontains=query))
        return queryset

class SkillCategoryListView(generics.ListAPIView):
    queryset = SkillCategory.objects.all()
    serializer_class = SkillCategorySerializer
    permission_classes = [permissions.AllowAny]

class MySkillListCreateView(generics.ListCreateAPIView):
    serializer_class = UserSkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserSkill.objects.filter(user=self.request.user).select_related("skill", "skill__category")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MySkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserSkill.objects.filter(user=self.request.user).select_related("skill", "skill__category")

class MatchListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        mine = UserSkill.objects.filter(user=request.user)
        if not mine.exists():
            return Response([])

        results = []
        for user in User.objects.exclude(pk=request.user.pk):
            match = build_match_data(request.user, user)
            if match["score"] <= 0 and not match["they_teach_me"] and not match["i_teach_them"]:
                continue

            profile, _ = Profile.objects.get_or_create(user=user)
            results.append({
                "user_id": user.id,
                "name": user.get_full_name() or user.username,
                "username": user.username,
                "avatar_url": profile.avatar_url,
                "location": profile.location,
                "average_rating": float(profile.average_rating),
                "review_count": profile.review_count,
                "completed_swaps": profile.completed_swaps,
                **match,
            })

        results.sort(key=lambda item: (-item["score"], -item["average_rating"], -item["completed_swaps"]))
        return Response(results)

