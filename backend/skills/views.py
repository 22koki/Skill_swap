from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import Profile
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
        mine = UserSkill.objects.filter(user=request.user).select_related("skill")
        my_teach_ids = set(mine.filter(kind=UserSkill.Kind.TEACH).values_list("skill_id", flat=True))
        my_learn_ids = set(mine.filter(kind=UserSkill.Kind.LEARN).values_list("skill_id", flat=True))

        if not my_teach_ids and not my_learn_ids:
            return Response([])

        candidate_ids = UserSkill.objects.filter(
            Q(kind=UserSkill.Kind.TEACH, skill_id__in=my_learn_ids) |
            Q(kind=UserSkill.Kind.LEARN, skill_id__in=my_teach_ids)
        ).exclude(user=request.user).values_list("user_id", flat=True).distinct()

        results = []
        for user in User.objects.filter(id__in=candidate_ids):
            their = UserSkill.objects.filter(user=user).select_related("skill")
            their_teach_ids = set(their.filter(kind=UserSkill.Kind.TEACH).values_list("skill_id", flat=True))
            their_learn_ids = set(their.filter(kind=UserSkill.Kind.LEARN).values_list("skill_id", flat=True))

            they_teach_me = my_learn_ids & their_teach_ids
            i_teach_them = my_teach_ids & their_learn_ids

            # A true two-way exchange is the strongest match.
            if they_teach_me and i_teach_them:
                score = 100
            elif they_teach_me or i_teach_them:
                score = 60
            else:
                score = 0

            profile, _ = Profile.objects.get_or_create(user=user)
            results.append({
                "user_id": user.id,
                "name": user.get_full_name() or user.username,
                "username": user.username,
                "avatar_url": profile.avatar_url,
                "location": profile.location,
                "average_rating": float(profile.average_rating),
                "completed_swaps": profile.completed_swaps,
                "score": score,
                "they_teach_me": list(Skill.objects.filter(id__in=they_teach_me).values("id", "name")),
                "i_teach_them": list(Skill.objects.filter(id__in=i_teach_them).values("id", "name")),
            })

        results.sort(key=lambda item: (-item["score"], -item["average_rating"], -item["completed_swaps"]))
        return Response(results)
