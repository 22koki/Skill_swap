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


class SkillPassportView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        from django.contrib.auth.models import User
        from django.db.models import Q, Sum
        from bookings.models import Booking
        from skills.models import UserSkill
        from reviews.services import reputation_badges

        user = get_object_or_404(User, pk=user_id)
        profile, _ = Profile.objects.get_or_create(user=user)

        skill_links = UserSkill.objects.filter(user=user).select_related("skill", "skill__category")
        teach_skills = skill_links.filter(kind=UserSkill.Kind.TEACH)
        learn_skills = skill_links.filter(kind=UserSkill.Kind.LEARN)

        completed_bookings = Booking.objects.filter(
            Q(swap__requester=user) | Q(swap__recipient=user),
            status=Booking.Status.COMPLETED,
        ).select_related(
            "swap", "swap__requester", "swap__recipient",
            "swap__offered_skill", "swap__requested_skill",
        ).order_by("-starts_at")

        total_minutes = completed_bookings.aggregate(total=Sum("duration_minutes"))["total"] or 0
        partner_ids = set()
        journeys = []

        for booking in completed_bookings[:8]:
            swap = booking.swap
            if swap.requester_id == user.id:
                partner = swap.recipient
                taught = swap.offered_skill
                learned = swap.requested_skill
            else:
                partner = swap.requester
                taught = swap.requested_skill
                learned = swap.offered_skill

            partner_ids.add(partner.id)
            journeys.append({
                "booking_id": booking.id,
                "partner_id": partner.id,
                "partner_name": partner.get_full_name() or partner.username,
                "taught_skill": taught.name,
                "learned_skill": learned.name,
                "duration_minutes": booking.duration_minutes,
                "starts_at": booking.starts_at,
            })

        badges = reputation_badges(profile)
        milestones = []
        completed_count = profile.completed_swaps
        if completed_count >= 1:
            milestones.append({"icon":"🤝","label":"First exchange completed","value":"1st swap"})
        if total_minutes >= 60:
            milestones.append({"icon":"⏱","label":"Learning time unlocked","value":f"{round(total_minutes / 60, 1)} hrs"})
        if len(partner_ids) >= 3:
            milestones.append({"icon":"🌐","label":"Learning network growing","value":f"{len(partner_ids)} partners"})
        if profile.review_count >= 1:
            milestones.append({"icon":"⭐","label":"First reputation review","value":f"{profile.review_count} review" + ("s" if profile.review_count != 1 else "")})
        if len(teach_skills) >= 3:
            milestones.append({"icon":"🎓","label":"Multi-skill teacher","value":f"{len(teach_skills)} skills"})
        if len(learn_skills) >= 3:
            milestones.append({"icon":"🌱","label":"Curious learner","value":f"{len(learn_skills)} goals"})

        return Response({
            "passport_code": f"SS-{user.id:05d}",
            "user_id": user.id,
            "name": user.get_full_name() or user.username,
            "username": user.username,
            "member_since": user.date_joined,
            "avatar_url": profile.avatar_url,
            "bio": profile.bio,
            "location": profile.location,
            "session_preference": profile.session_preference,
            "availability_note": profile.availability_note,
            "stats": {
                "completed_swaps": profile.completed_swaps,
                "total_hours_exchanged": round(total_minutes / 60, 1),
                "teaching_hours": round(total_minutes / 60, 1),
                "learning_hours": round(total_minutes / 60, 1),
                "unique_partners": len(partner_ids),
                "review_count": profile.review_count,
                "average_rating": float(profile.average_rating),
                "would_swap_again_percent": profile.would_swap_again_percent,
            },
            "reputation": {
                "teaching": float(profile.teaching_rating),
                "communication": float(profile.communication_rating),
                "reliability": float(profile.reliability_rating),
                "friendliness": float(profile.friendliness_rating),
            },
            "teach_skills": [
                {
                    "id": item.skill_id,
                    "name": item.skill.name,
                    "level": item.level,
                    "category": item.skill.category.name if item.skill.category else "",
                    "category_icon": item.skill.category.icon if item.skill.category else "",
                }
                for item in teach_skills
            ],
            "learn_skills": [
                {
                    "id": item.skill_id,
                    "name": item.skill.name,
                    "level": item.level,
                    "category": item.skill.category.name if item.skill.category else "",
                    "category_icon": item.skill.category.icon if item.skill.category else "",
                }
                for item in learn_skills
            ],
            "badges": badges,
            "milestones": milestones,
            "recent_journeys": journeys,
        })
