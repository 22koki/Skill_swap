from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile, AvailabilitySlot
from .serializers import RegisterSerializer, UserSerializer, AvailabilitySlotSerializer
from .matching import build_match_data
from .progression import build_progression

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
        from skills.models import UserSkill

        current_user = request.user if request.user.is_authenticated else None
        users = User.objects.all().order_by("date_joined")
        if current_user:
            users = users.exclude(pk=current_user.pk)

        results = []
        for user in users:
            profile, _ = Profile.objects.get_or_create(user=user)
            their = UserSkill.objects.filter(user=user).select_related("skill")
            teach_items = list(their.filter(kind=UserSkill.Kind.TEACH))
            learn_items = list(their.filter(kind=UserSkill.Kind.LEARN))

            match = build_match_data(current_user, user) if current_user else None

            results.append({
                "user_id": user.id,
                "name": user.get_full_name() or user.username,
                "username": user.username,
                "avatar_url": profile.avatar_url,
                "location": profile.location,
                "session_preference": profile.session_preference,
                "average_rating": float(profile.average_rating),
                "review_count": profile.review_count,
                "completed_swaps": profile.completed_swaps,
                "teach_skills": [
                    {"id": item.skill_id, "name": item.skill.name, "level": item.level}
                    for item in teach_items
                ],
                "learn_skills": [
                    {"id": item.skill_id, "name": item.skill.name, "level": item.level}
                    for item in learn_items
                ],
                "score": match["score"] if match else None,
                "confidence": match["confidence"] if match else "",
                "breakdown": match["breakdown"] if match else {},
                "reasons": match["reasons"] if match else [],
                "missing": match["missing"] if match else [],
                "suggested_times": match["suggested_times"] if match else [],
                "they_teach_me": match["they_teach_me"] if match else [],
                "i_teach_them": match["i_teach_them"] if match else [],
            })

        results.sort(
            key=lambda item: (
                -(item["score"] if item["score"] is not None else -1),
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
            "progression": build_progression(user),
        })


class MyAvailabilityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        slots = AvailabilitySlot.objects.filter(user=request.user)
        return Response(AvailabilitySlotSerializer(slots, many=True).data)

    def put(self, request):
        serializer = AvailabilitySlotSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        AvailabilitySlot.objects.filter(user=request.user).delete()
        created = [
            AvailabilitySlot.objects.create(user=request.user, **item)
            for item in serializer.validated_data
        ]
        return Response(AvailabilitySlotSerializer(created, many=True).data)


class UserProgressionView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        from django.contrib.auth.models import User
        user = get_object_or_404(User, pk=user_id)
        return Response(build_progression(user))


class SkillNetworkView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.contrib.auth.models import User
        from skills.models import Skill, UserSkill

        current_user = request.user if request.user.is_authenticated else None
        all_users = list(User.objects.all().order_by("date_joined"))
        skill_links = list(
            UserSkill.objects.select_related(
                "user", "skill", "skill__category"
            ).order_by("skill__name", "user__username")
        )

        links_by_user = {}
        links_by_skill = {}
        for link in skill_links:
            links_by_user.setdefault(link.user_id, []).append(link)
            links_by_skill.setdefault(link.skill_id, []).append(link)

        users = []
        for user in all_users:
            profile, _ = Profile.objects.get_or_create(user=user)
            links = links_by_user.get(user.id, [])
            progression = build_progression(user)
            match = None
            if current_user and user.id != current_user.id:
                match = build_match_data(current_user, user)

            users.append({
                "id": user.id,
                "name": user.get_full_name() or user.username,
                "username": user.username,
                "avatar_url": profile.avatar_url,
                "location": profile.location,
                "average_rating": float(profile.average_rating),
                "review_count": profile.review_count,
                "completed_swaps": profile.completed_swaps,
                "is_me": bool(current_user and user.id == current_user.id),
                "level": progression["level"],
                "xp": progression["xp"],
                "current_streak": progression["current_streak"],
                "teach_skills": [
                    {
                        "id": link.skill_id,
                        "name": link.skill.name,
                        "level": link.level,
                    }
                    for link in links if link.kind == UserSkill.Kind.TEACH
                ],
                "learn_skills": [
                    {
                        "id": link.skill_id,
                        "name": link.skill.name,
                        "level": link.level,
                    }
                    for link in links if link.kind == UserSkill.Kind.LEARN
                ],
                "match": match,
            })

        skills = []
        for skill in Skill.objects.select_related("category").all():
            links = links_by_skill.get(skill.id, [])
            teacher_count = sum(1 for link in links if link.kind == UserSkill.Kind.TEACH)
            learner_count = sum(1 for link in links if link.kind == UserSkill.Kind.LEARN)
            if not links:
                continue
            skills.append({
                "id": skill.id,
                "name": skill.name,
                "category": skill.category.name if skill.category else "Other",
                "category_icon": skill.category.icon if skill.category else "",
                "teacher_count": teacher_count,
                "learner_count": learner_count,
                "connection_count": len(links),
            })

        edges = [
            {
                "id": f"{link.user_id}-{link.skill_id}-{link.kind}",
                "user_id": link.user_id,
                "skill_id": link.skill_id,
                "kind": link.kind,
                "level": link.level,
            }
            for link in skill_links
        ]

        my_path = []
        if current_user:
            mine = links_by_user.get(current_user.id, [])
            my_learn_ids = [
                link.skill_id for link in mine if link.kind == UserSkill.Kind.LEARN
            ]
            for wanted_skill_id in my_learn_ids:
                wanted_skill = next((skill for skill in skills if skill["id"] == wanted_skill_id), None)
                if not wanted_skill:
                    continue

                teacher_links = [
                    link for link in links_by_skill.get(wanted_skill_id, [])
                    if link.kind == UserSkill.Kind.TEACH and link.user_id != current_user.id
                ]
                if not teacher_links:
                    continue

                teacher = teacher_links[0].user
                teacher_wants = [
                    link for link in links_by_user.get(teacher.id, [])
                    if link.kind == UserSkill.Kind.LEARN
                ]

                bridge = None
                for teacher_want in teacher_wants:
                    next_teacher = next(
                        (
                            link.user for link in links_by_skill.get(teacher_want.skill_id, [])
                            if link.kind == UserSkill.Kind.TEACH
                            and link.user_id not in {current_user.id, teacher.id}
                        ),
                        None,
                    )
                    if next_teacher:
                        bridge = {
                            "skill": {
                                "id": teacher_want.skill_id,
                                "name": teacher_want.skill.name,
                            },
                            "user": {
                                "id": next_teacher.id,
                                "name": next_teacher.get_full_name() or next_teacher.username,
                            },
                        }
                        break

                my_path = [
                    {"type": "user", "id": current_user.id, "label": "You"},
                    {"type": "skill", "id": wanted_skill_id, "label": wanted_skill["name"]},
                    {"type": "user", "id": teacher.id, "label": teacher.get_full_name() or teacher.username},
                ]
                if bridge:
                    my_path.extend([
                        {"type": "skill", "id": bridge["skill"]["id"], "label": bridge["skill"]["name"]},
                        {"type": "user", "id": bridge["user"]["id"], "label": bridge["user"]["name"]},
                    ])
                break

        return Response({
            "users": users,
            "skills": skills,
            "edges": edges,
            "my_path": my_path,
            "stats": {
                "people": len(users),
                "skills": len(skills),
                "connections": len(edges),
                "teachers": len({edge["user_id"] for edge in edges if edge["kind"] == "teach"}),
                "learners": len({edge["user_id"] for edge in edges if edge["kind"] == "learn"}),
            },
        })
