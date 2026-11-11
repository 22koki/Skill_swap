from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile, AvailabilitySlot, UserBlock, SafetyReport, AccountStanding
from .serializers import RegisterSerializer, UserSerializer, AvailabilitySlotSerializer, UserBlockSerializer, SafetyReportSerializer, AccountStandingSerializer
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



class UniversalSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.contrib.auth.models import User
        from django.db.models import Count, Q
        from skills.models import Skill, UserSkill
        from circles.models import SkillCircle, CircleMember

        query = str(request.query_params.get("q", "")).strip()
        needle = query.lower()
        current_user = request.user if request.user.is_authenticated else None

        def text_score(value, exact=100, starts=82, contains=58):
            value = str(value or "").strip().lower()
            if not needle or not value:
                return 0
            if value == needle:
                return exact
            if value.startswith(needle):
                return starts
            if needle in value:
                return contains
            return 0

        user_qs = User.objects.select_related("profile").prefetch_related(
            "skill_links__skill",
            "circle_memberships__circle",
        )

        if query:
            user_qs = user_qs.filter(
                Q(username__icontains=query)
                | Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(profile__bio__icontains=query)
                | Q(profile__location__icontains=query)
                | Q(skill_links__skill__name__icontains=query)
                | Q(skill_links__skill__category__name__icontains=query)
            ).distinct()
        else:
            user_qs = user_qs.order_by("-profile__average_rating", "-profile__completed_swaps", "username")[:10]

        people = []
        for user in list(user_qs)[:18]:
            profile, _ = Profile.objects.get_or_create(user=user)
            links = list(user.skill_links.select_related("skill").all())
            teach_skills = [
                {"id": item.skill_id, "name": item.skill.name, "level": item.level}
                for item in links if item.kind == UserSkill.Kind.TEACH
            ]
            learn_skills = [
                {"id": item.skill_id, "name": item.skill.name, "level": item.level}
                for item in links if item.kind == UserSkill.Kind.LEARN
            ]
            mentor_memberships = [
                membership for membership in user.circle_memberships.all()
                if membership.role == CircleMember.Role.MENTOR
            ]
            is_mentor = bool(mentor_memberships)

            score = 0
            if query:
                full_name = user.get_full_name() or user.username
                score = max(
                    text_score(user.username, 120, 98, 74),
                    text_score(full_name, 118, 96, 72),
                    text_score(profile.location, 74, 62, 48),
                    text_score(profile.bio, 68, 58, 44),
                )
                for skill in teach_skills:
                    score = max(score, text_score(skill["name"], 112, 92, 70) + 7)
                for skill in learn_skills:
                    score = max(score, text_score(skill["name"], 102, 84, 64))
                if is_mentor and "mentor".startswith(needle):
                    score = max(score, 88)
            else:
                score = 50 + min(25, int(float(profile.average_rating) * 4)) + min(20, profile.completed_swaps)

            match = None
            if current_user and current_user.id != user.id:
                match = build_match_data(current_user, user)

            people.append({
                "type": "person",
                "user_id": user.id,
                "name": user.get_full_name() or user.username,
                "username": user.username,
                "avatar_url": profile.avatar_url,
                "bio": profile.bio,
                "location": profile.location,
                "average_rating": float(profile.average_rating),
                "review_count": profile.review_count,
                "completed_swaps": profile.completed_swaps,
                "teach_skills": teach_skills,
                "learn_skills": learn_skills,
                "is_mentor": is_mentor,
                "mentor_circle_count": len(mentor_memberships),
                "mentor_circles": [
                    {"id": membership.circle_id, "title": membership.circle.title}
                    for membership in mentor_memberships[:3]
                ],
                "score": score,
                "match_score": match["score"] if match else None,
                "match_confidence": match["confidence"] if match else "",
                "they_teach_me": match["they_teach_me"] if match else [],
                "i_teach_them": match["i_teach_them"] if match else [],
                "reasons": match["reasons"] if match else [],
            })

        people.sort(
            key=lambda item: (
                -item["score"],
                -item["average_rating"],
                -item["completed_swaps"],
                item["name"].lower(),
            )
        )
        people = people[:10]

        skill_qs = Skill.objects.select_related("category").annotate(
            teacher_count=Count("user_links", filter=Q(user_links__kind=UserSkill.Kind.TEACH), distinct=True),
            learner_count=Count("user_links", filter=Q(user_links__kind=UserSkill.Kind.LEARN), distinct=True),
        )
        if query:
            skill_qs = skill_qs.filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(category__name__icontains=query)
            )
        else:
            skill_qs = skill_qs.order_by("-teacher_count", "-learner_count", "name")[:10]

        skills = []
        for skill in list(skill_qs)[:14]:
            score = (
                max(
                    text_score(skill.name, 120, 100, 78),
                    text_score(skill.category.name if skill.category else "", 84, 70, 52),
                    text_score(skill.description, 68, 58, 42),
                )
                if query
                else 50 + min(40, skill.teacher_count + skill.learner_count)
            )
            skills.append({
                "type": "skill",
                "id": skill.id,
                "name": skill.name,
                "description": skill.description,
                "category": skill.category.name if skill.category else "Other",
                "category_icon": skill.category.icon if skill.category else "",
                "teacher_count": skill.teacher_count,
                "learner_count": skill.learner_count,
                "connection_count": skill.teacher_count + skill.learner_count,
                "score": score,
            })
        skills.sort(key=lambda item: (-item["score"], -item["connection_count"], item["name"].lower()))
        skills = skills[:8]

        circle_qs = SkillCircle.objects.select_related(
            "primary_skill", "primary_skill__category", "created_by"
        ).prefetch_related("memberships__user").annotate(
            member_count_annotated=Count("memberships", distinct=True)
        )
        if not current_user:
            circle_qs = circle_qs.filter(is_public=True)

        if query:
            circle_qs = circle_qs.filter(
                Q(title__icontains=query)
                | Q(description__icontains=query)
                | Q(goal__icontains=query)
                | Q(primary_skill__name__icontains=query)
                | Q(primary_skill__category__name__icontains=query)
                | Q(circle_type__icontains=query)
            )
        else:
            circle_qs = circle_qs.order_by("-member_count_annotated", "-updated_at")[:10]

        circles = []
        for circle in list(circle_qs)[:12]:
            membership = None
            if current_user:
                current_membership = circle.memberships.filter(user=current_user).first()
                if current_membership:
                    membership = {"role": current_membership.role}

            score = (
                max(
                    text_score(circle.title, 120, 100, 78),
                    text_score(circle.primary_skill.name if circle.primary_skill else "", 112, 92, 70),
                    text_score(circle.goal, 78, 64, 48),
                    text_score(circle.description, 72, 60, 44),
                    text_score(circle.get_circle_type_display(), 74, 62, 46),
                )
                if query
                else 50 + min(40, circle.member_count_annotated * 3)
            )
            circles.append({
                "type": "circle",
                "id": circle.id,
                "title": circle.title,
                "circle_type": circle.circle_type,
                "circle_type_label": circle.get_circle_type_display(),
                "cover_emoji": circle.cover_emoji,
                "description": circle.description,
                "goal": circle.goal,
                "primary_skill_name": circle.primary_skill.name if circle.primary_skill else "",
                "primary_skill_id": circle.primary_skill_id,
                "member_count": circle.member_count_annotated,
                "mentor_count": circle.memberships.filter(role=CircleMember.Role.MENTOR).count(),
                "membership": membership,
                "score": score,
            })
        circles.sort(key=lambda item: (-item["score"], -item["member_count"], item["title"].lower()))
        circles = circles[:8]

        mentors = [person for person in people if person["is_mentor"]][:6]

        return Response({
            "query": query,
            "people": people,
            "mentors": mentors,
            "skills": skills,
            "circles": circles,
            "counts": {
                "people": len(people),
                "mentors": len(mentors),
                "skills": len(skills),
                "circles": len(circles),
            },
        })



def _report_evidence(target_type, target_id, reported_user):
    evidence = {}
    if target_type == SafetyReport.TargetType.MESSAGE and target_id:
        from messaging.models import Message
        message = Message.objects.select_related("sender").filter(pk=target_id).first()
        if message:
            evidence = {
                "message_id": message.id,
                "sender_id": message.sender_id,
                "sender_name": message.sender.get_full_name() or message.sender.username,
                "body": message.body[:1000],
                "created_at": message.created_at.isoformat(),
            }
    elif target_type == SafetyReport.TargetType.CIRCLE and target_id:
        from circles.models import SkillCircle
        circle = SkillCircle.objects.filter(pk=target_id).first()
        if circle:
            evidence = {
                "circle_id": circle.id,
                "title": circle.title,
                "description": circle.description[:1000],
            }
    elif target_type == SafetyReport.TargetType.CIRCLE_MESSAGE and target_id:
        from circles.models import CircleMessage
        message = CircleMessage.objects.select_related("sender", "circle").filter(pk=target_id).first()
        if message:
            evidence = {
                "message_id": message.id,
                "circle_id": message.circle_id,
                "circle_title": message.circle.title,
                "sender_id": message.sender_id,
                "sender_name": message.sender.get_full_name() or message.sender.username,
                "body": message.body[:1000],
                "created_at": message.created_at.isoformat(),
            }
    elif target_type == SafetyReport.TargetType.USER and reported_user:
        profile = getattr(reported_user, "profile", None)
        evidence = {
            "user_id": reported_user.id,
            "username": reported_user.username,
            "name": reported_user.get_full_name() or reported_user.username,
            "bio": (profile.bio if profile else "")[:1000],
        }
    return evidence


class BlockedUsersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        blocks = UserBlock.objects.filter(blocker=request.user).select_related("blocked", "blocked__profile")
        return Response(UserBlockSerializer(blocks, many=True).data)


class UserBlockView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        from django.contrib.auth.models import User
        from swaps.models import Swap

        target = get_object_or_404(User, pk=user_id)
        if target == request.user:
            return Response({"detail": "You cannot block yourself."}, status=400)

        block, created = UserBlock.objects.get_or_create(blocker=request.user, blocked=target)

        # Stop pending proposals between these users. Accepted/completed swaps remain as history.
        Swap.objects.filter(
            Q(requester=request.user, recipient=target) | Q(requester=target, recipient=request.user),
            status=Swap.Status.PROPOSED,
        ).update(status=Swap.Status.CANCELLED)

        return Response({
            "blocked": True,
            "created": created,
            "block": UserBlockSerializer(block).data,
        })

    def delete(self, request, user_id):
        UserBlock.objects.filter(blocker=request.user, blocked_id=user_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SafetyReportCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from django.contrib.auth.models import User

        target_type = str(request.data.get("target_type", "")).strip()
        reason = str(request.data.get("reason", "")).strip()
        target_id = request.data.get("target_id")
        reported_user_id = request.data.get("reported_user")

        valid_targets = {choice for choice, _ in SafetyReport.TargetType.choices}
        valid_reasons = {choice for choice, _ in SafetyReport.Reason.choices}
        if target_type not in valid_targets:
            return Response({"detail": "Choose a valid report target."}, status=400)
        if reason not in valid_reasons:
            return Response({"detail": "Choose a valid report reason."}, status=400)

        reported_user = None
        if reported_user_id:
            reported_user = get_object_or_404(User, pk=reported_user_id)
        if reported_user == request.user:
            return Response({"detail": "You cannot report yourself."}, status=400)

        evidence = _report_evidence(target_type, target_id, reported_user)
        report = SafetyReport.objects.create(
            reporter=request.user,
            reported_user=reported_user,
            target_type=target_type,
            target_id=target_id or None,
            reason=reason,
            details=str(request.data.get("details", "")).strip()[:3000],
            evidence=evidence,
        )
        return Response(SafetyReportSerializer(report).data, status=201)


class MySafetyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        standing, _ = AccountStanding.objects.get_or_create(user=request.user)
        reports = SafetyReport.objects.filter(reporter=request.user)[:20]
        return Response({
            "standing": AccountStandingSerializer(standing).data,
            "reports": SafetyReportSerializer(reports, many=True).data,
            "blocked": UserBlockSerializer(
                UserBlock.objects.filter(blocker=request.user).select_related("blocked", "blocked__profile"),
                many=True,
            ).data,
        })


class ModerationQueueView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        reports = SafetyReport.objects.select_related(
            "reporter", "reported_user", "reviewed_by"
        ).all()
        status_filter = request.query_params.get("status", "").strip()
        if status_filter:
            reports = reports.filter(status=status_filter)
        return Response(SafetyReportSerializer(reports[:100], many=True).data)


class ModerationReportActionView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk, action):
        from datetime import timedelta
        from django.utils import timezone

        report = get_object_or_404(SafetyReport, pk=pk)
        if action not in {"review", "dismiss", "resolve", "warn", "restrict", "suspend"}:
            return Response({"detail": "Unknown moderation action."}, status=400)

        report.reviewed_by = request.user
        report.reviewed_at = timezone.now()
        report.resolution_note = str(request.data.get("note", "")).strip()[:3000]

        if action == "review":
            report.status = SafetyReport.Status.REVIEWING
        elif action == "dismiss":
            report.status = SafetyReport.Status.DISMISSED
            report.resolution_action = SafetyReport.ResolutionAction.NONE
        else:
            report.status = SafetyReport.Status.RESOLVED
            if action == "resolve":
                report.resolution_action = SafetyReport.ResolutionAction.NONE
            elif report.reported_user:
                standing, _ = AccountStanding.objects.get_or_create(user=report.reported_user)
                if action == "warn":
                    standing.warning_count += 1
                    standing.note = report.resolution_note
                    report.resolution_action = SafetyReport.ResolutionAction.WARN
                elif action == "restrict":
                    days = max(1, min(int(request.data.get("days", 7)), 30))
                    standing.restricted_until = timezone.now() + timedelta(days=days)
                    standing.note = report.resolution_note
                    report.resolution_action = SafetyReport.ResolutionAction.RESTRICT
                elif action == "suspend":
                    standing.suspended = True
                    standing.note = report.resolution_note
                    report.resolution_action = SafetyReport.ResolutionAction.SUSPEND
                standing.save()

        report.save()
        return Response(SafetyReportSerializer(report).data)
