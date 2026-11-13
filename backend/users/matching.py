from datetime import datetime, timedelta

from django.utils import timezone

from skills.models import Skill, UserSkill
from .models import AvailabilitySlot, Profile

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _session_preference_score(me, them):
    mine = me.session_preference
    theirs = them.session_preference
    compatible = mine == "both" or theirs == "both" or mine == theirs
    return (15 if compatible else 0), compatible


def _weekly_overlaps(user_a, user_b):
    mine = list(AvailabilitySlot.objects.filter(user=user_a).order_by("weekday", "start_time"))
    theirs = list(AvailabilitySlot.objects.filter(user=user_b).order_by("weekday", "start_time"))
    overlaps = []

    for left in mine:
        for right in theirs:
            if left.weekday != right.weekday:
                continue
            start = max(left.start_time, right.start_time)
            end = min(left.end_time, right.end_time)
            start_minutes = start.hour * 60 + start.minute
            end_minutes = end.hour * 60 + end.minute
            minutes = end_minutes - start_minutes
            if minutes >= 30:
                overlaps.append({
                    "weekday": left.weekday,
                    "day": DAY_NAMES[left.weekday],
                    "start_time": start.strftime("%H:%M"),
                    "end_time": end.strftime("%H:%M"),
                    "minutes": minutes,
                })

    return mine, theirs, overlaps


def _availability_score(user_a, user_b):
    mine, theirs, overlaps = _weekly_overlaps(user_a, user_b)
    if not mine or not theirs:
        return 0, overlaps, "missing"
    weekly_minutes = sum(item["minutes"] for item in overlaps)
    if weekly_minutes >= 180:
        return 20, overlaps, "excellent"
    if weekly_minutes >= 60:
        return 16, overlaps, "good"
    if weekly_minutes >= 30:
        return 10, overlaps, "limited"
    return 0, overlaps, "none"


def _suggested_times(overlaps, limit=3):
    if not overlaps:
        return []

    now = timezone.localtime()
    today = now.date()
    suggestions = []

    for days_ahead in range(0, 22):
        date_value = today + timedelta(days=days_ahead)
        weekday = date_value.weekday()
        for overlap in overlaps:
            if overlap["weekday"] != weekday:
                continue

            hour, minute = [int(x) for x in overlap["start_time"].split(":")]
            start_dt = timezone.make_aware(
                datetime.combine(date_value, datetime.min.time()).replace(hour=hour, minute=minute),
                timezone.get_current_timezone(),
            )
            if start_dt <= now + timedelta(minutes=30):
                continue

            suggestions.append({
                **overlap,
                "date": date_value.isoformat(),
                "starts_at": start_dt.isoformat(),
                "label": f'{overlap["day"][:3]}, {date_value.strftime("%b %d")} · {overlap["start_time"]}–{overlap["end_time"]}',
            })
            if len(suggestions) >= limit:
                return suggestions

    return suggestions


def build_match_data(current_user, other_user):
    mine = UserSkill.objects.filter(user=current_user).select_related("skill")
    theirs = UserSkill.objects.filter(user=other_user).select_related("skill")

    my_teach_ids = set(mine.filter(kind=UserSkill.Kind.TEACH).values_list("skill_id", flat=True))
    my_learn_ids = set(mine.filter(kind=UserSkill.Kind.LEARN).values_list("skill_id", flat=True))
    their_teach_ids = set(theirs.filter(kind=UserSkill.Kind.TEACH).values_list("skill_id", flat=True))
    their_learn_ids = set(theirs.filter(kind=UserSkill.Kind.LEARN).values_list("skill_id", flat=True))

    they_teach_me = my_learn_ids & their_teach_ids
    i_teach_them = my_teach_ids & their_learn_ids

    if they_teach_me and i_teach_them:
        skill_score = 40
        skill_status = "mutual"
    elif they_teach_me or i_teach_them:
        skill_score = 20
        skill_status = "one_way"
    else:
        skill_score = 0
        skill_status = "none"

    my_profile, _ = Profile.objects.get_or_create(user=current_user)
    other_profile, _ = Profile.objects.get_or_create(user=other_user)

    availability_score, overlaps, availability_status = _availability_score(current_user, other_user)
    preference_score, preference_compatible = _session_preference_score(my_profile, other_profile)

    if other_profile.review_count:
        reputation_score = min(
            15,
            round((float(other_profile.average_rating) / 5 * 10) + (float(other_profile.reliability_rating) / 5 * 5)),
        )
    else:
        reputation_score = 5

    experience_score = min(10, other_profile.completed_swaps)
    total = min(100, skill_score + availability_score + preference_score + reputation_score + experience_score)

    if total >= 85:
        confidence = "Excellent match"
    elif total >= 70:
        confidence = "Strong match"
    elif total >= 55:
        confidence = "Good match"
    elif total >= 35:
        confidence = "Possible match"
    else:
        confidence = "Low compatibility"

    reasons = []
    if skill_status == "mutual":
        reasons.append({"type":"strong","icon":"⇄","label":"True two-way skill match"})
    elif skill_status == "one_way":
        reasons.append({"type":"partial","icon":"↗","label":"One-way skill overlap"})
    else:
        reasons.append({"type":"muted","icon":"○","label":"No direct skill overlap yet"})

    if availability_status == "excellent":
        reasons.append({"type":"strong","icon":"📅","label":"Great schedule overlap"})
    elif availability_status == "good":
        reasons.append({"type":"strong","icon":"🕒","label":"Shared weekly availability"})
    elif availability_status == "limited":
        reasons.append({"type":"partial","icon":"🕒","label":"Limited shared availability"})
    elif availability_status == "missing":
        reasons.append({"type":"muted","icon":"📅","label":"Availability still incomplete"})
    else:
        reasons.append({"type":"muted","icon":"📅","label":"No shared time found"})

    if preference_compatible:
        mode = other_profile.get_session_preference_display()
        reasons.append({"type":"strong","icon":"⚡","label":f"Session style compatible · {mode}"})
    else:
        reasons.append({"type":"partial","icon":"⚡","label":"Different session preferences"})

    if other_profile.review_count and float(other_profile.reliability_rating) >= 4.5:
        reasons.append({"type":"strong","icon":"🛡️","label":"Highly reliable"})
    elif other_profile.review_count:
        reasons.append({"type":"neutral","icon":"⭐","label":f"{float(other_profile.average_rating):.1f} reputation"})
    else:
        reasons.append({"type":"neutral","icon":"✨","label":"New member · reputation growing"})

    if other_profile.completed_swaps:
        reasons.append({"type":"neutral","icon":"🤝","label":f"{other_profile.completed_swaps} completed swaps"})

    missing = []
    if not i_teach_them and they_teach_me:
        missing.append("Add a skill they want to turn this into a two-way exchange.")
    elif i_teach_them and not they_teach_me:
        missing.append("They need to teach one of your learning goals for a two-way exchange.")
    if availability_status == "missing":
        missing.append("Both people should add weekly availability for better time recommendations.")
    elif availability_status == "none":
        missing.append("Your weekly schedules currently do not overlap.")

    return {
        "score": total,
        "confidence": confidence,
        "breakdown": {
            "skills": {"score": skill_score, "max": 40},
            "availability": {"score": availability_score, "max": 20},
            "session_preference": {"score": preference_score, "max": 15},
            "reputation": {"score": reputation_score, "max": 15},
            "experience": {"score": experience_score, "max": 10},
        },
        "reasons": reasons,
        "missing": missing,
        "suggested_times": _suggested_times(overlaps),
        "they_teach_me": list(Skill.objects.filter(id__in=they_teach_me).values("id", "name")),
        "i_teach_them": list(Skill.objects.filter(id__in=i_teach_them).values("id", "name")),
    }
