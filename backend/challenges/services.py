from datetime import timedelta

from django.utils import timezone

from community.models import Post
from goals.models import Milestone

from .catalog import CHALLENGES


def activity_timestamps(user):
    """Server-recorded actions: completed milestones and authored community posts."""
    milestones = Milestone.objects.filter(
        goal__owner=user, is_done=True, completed_at__isnull=False
    ).values_list("completed_at", flat=True)
    posts = Post.objects.filter(author=user).values_list("created_at", flat=True)
    return list(milestones) + list(posts)


def learning_streak(user):
    days = sorted({timezone.localtime(t).date() for t in activity_timestamps(user)}, reverse=True)
    today = timezone.localdate()
    current = 0
    if days and days[0] in (today, today - timedelta(days=1)):
        expected = days[0]
        for day in days:
            if day != expected:
                break
            current += 1
            expected -= timedelta(days=1)

    best = 0
    running = 0
    previous = None
    for day in reversed(days):
        running = running + 1 if previous and day == previous + timedelta(days=1) else 1
        best = max(best, running)
        previous = day
    return {"current": current, "best": best, "active_days": len(days), "active_today": today in days}


def challenge_progress(user, challenge, enrolled_at):
    deadline = enrolled_at + timedelta(days=challenge["duration_days"])
    end = min(timezone.now(), deadline)
    kind = challenge["kind"]
    if kind == "milestones":
        value = Milestone.objects.filter(
            goal__owner=user, is_done=True, completed_at__gte=enrolled_at, completed_at__lt=end
        ).count()
    elif kind == "projects":
        value = Post.objects.filter(
            author=user, kind=Post.Kind.PROJECT,
            created_at__gte=enrolled_at, created_at__lt=end
        ).count()
    else:
        events = activity_timestamps(user)
        value = len({
            timezone.localtime(moment).date()
            for moment in events if enrolled_at <= moment < end
        })
    return min(value, challenge["target"])


def challenges_dashboard(user):
    from .models import ChallengeEnrollment

    enrolled = {e.slug: e for e in ChallengeEnrollment.objects.filter(user=user)}
    now = timezone.now()
    results = []
    completed = 0
    for challenge in CHALLENGES:
        registration = enrolled.get(challenge["slug"])
        current = challenge_progress(user, challenge, registration.joined_at) if registration else 0
        is_complete = bool(registration and current >= challenge["target"])
        expired = bool(registration and now >= registration.joined_at + timedelta(days=challenge["duration_days"]))
        state = "completed" if is_complete else ("expired" if expired else ("joined" if registration else "available"))
        completed += int(is_complete)
        results.append({
            **challenge,
            "joined_at": registration.joined_at.isoformat() if registration else None,
            "ends_at": (registration.joined_at + timedelta(days=challenge["duration_days"])).isoformat() if registration else None,
            "progress": current,
            "percent": round(100 * current / challenge["target"]),
            "state": state,
        })
    return {
        "streak": learning_streak(user),
        "completed_challenges": completed,
        "earned_xp": sum(item["xp"] for item in results if item["state"] == "completed"),
        "badges": [{"name": item["badge"], "icon": item["icon"]} for item in results if item["state"] == "completed"],
        "challenges": results,
    }
