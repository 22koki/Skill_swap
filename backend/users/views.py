from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile
from .serializers import RegisterSerializer, UserSerializer

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=201)

class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        Profile.objects.get_or_create(user=self.request.user)
        return self.request.user

class PublicProfileView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        from django.contrib.auth.models import User
        user = get_object_or_404(User, pk=user_id)
        Profile.objects.get_or_create(user=user)
        return Response(UserSerializer(user).data)


class CommunityUsersView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.contrib.auth.models import User
        from skills.models import Skill, UserSkill

        current_user = request.user if request.user.is_authenticated else None
        users = User.objects.all().order_by("date_joined")

        if current_user:
            users = users.exclude(pk=current_user.pk)
            mine = UserSkill.objects.filter(user=current_user)
            my_teach_ids = set(mine.filter(kind=UserSkill.Kind.TEACH).values_list("skill_id", flat=True))
            my_learn_ids = set(mine.filter(kind=UserSkill.Kind.LEARN).values_list("skill_id", flat=True))
        else:
            my_teach_ids = set()
            my_learn_ids = set()

        results = []
        for user in users:
            profile, _ = Profile.objects.get_or_create(user=user)
            their = UserSkill.objects.filter(user=user).select_related("skill")
            teach_items = list(their.filter(kind=UserSkill.Kind.TEACH))
            learn_items = list(their.filter(kind=UserSkill.Kind.LEARN))

            their_teach_ids = {item.skill_id for item in teach_items}
            their_learn_ids = {item.skill_id for item in learn_items}

            if current_user and (my_teach_ids or my_learn_ids):
                they_teach_me = my_learn_ids & their_teach_ids
                i_teach_them = my_teach_ids & their_learn_ids
                if they_teach_me and i_teach_them:
                    score = 100
                elif they_teach_me or i_teach_them:
                    score = 60
                else:
                    score = 0
            else:
                they_teach_me = set()
                i_teach_them = set()
                score = None

            results.append({
                "user_id": user.id,
                "name": user.get_full_name() or user.username,
                "username": user.username,
                "avatar_url": profile.avatar_url,
                "location": profile.location,
                "average_rating": float(profile.average_rating),
                "review_count": profile.review_count,
                "completed_swaps": profile.completed_swaps,
                "match_score": score,
                "teach_skills": [
                    {"id": item.skill_id, "name": item.skill.name, "level": item.level}
                    for item in teach_items
                ],
                "learn_skills": [
                    {"id": item.skill_id, "name": item.skill.name, "level": item.level}
                    for item in learn_items
                ],
                "they_teach_me": list(Skill.objects.filter(id__in=they_teach_me).values("id", "name")),
                "i_teach_them": list(Skill.objects.filter(id__in=i_teach_them).values("id", "name")),
            })

        results.sort(
            key=lambda item: (
                -(item["match_score"] if item["match_score"] is not None else -1),
                -item["average_rating"],
                -item["completed_swaps"],
            )
        )
        return Response(results)
