from datetime import timedelta

from django.db.models import Q, Sum
from django.utils import timezone

from bookings.models import Booking
from reviews.models import Review
from skills.models import UserSkill


LEVELS = [
    {"level": 1, "name": "New Swapper", "min_xp": 0, "icon": "✦"},
    {"level": 2, "name": "Skill Explorer", "min_xp": 250, "icon": "🧭"},
    {"level": 3, "name": "Skill Mentor", "min_xp": 700, "icon": "🎓"},
    {"level": 4, "name": "Knowledge Connector", "min_xp": 1500, "icon": "🌐"},
    {"level": 5, "name": "Community Pro", "min_xp": 3000, "icon": "🏆"},
]


def _completed_bookings(user):
    return Booking.objects.filter(
        Q(swap__requester=user) | Q(swap__recipient=user),
        status=Booking.Status.COMPLETED,
    ).select_related("swap__requester", "swap__recipient")


def _week_start(value):
    local = timezone.localtime(value)
    return local.date() - timedelta(days=local.weekday())


def _weekly_streak(bookings):
    weeks = sorted({_week_start(item.starts_at) for item in bookings}, reverse=True)
    if not weeks:
        return 0, 0

    best = 1
    run = 1
    for previous, current in zip(weeks, weeks[1:]):
        if previous - current == timedelta(days=7):
            run += 1
            best = max(best, run)
        else:
            run = 1

    today = timezone.localdate()
    this_week = today - timedelta(days=today.weekday())
    last_week = this_week - timedelta(days=7)
    if weeks[0] not in {this_week, last_week}:
        current_streak = 0
    else:
        current_streak = 1
        for previous, current in zip(weeks, weeks[1:]):
            if previous - current == timedelta(days=7):
                current_streak += 1
            else:
                break

    return current_streak, best


def _achievement(key, icon, title, description, current, target, xp, category):
    unlocked = current >= target
    progress = 100 if unlocked else min(99, round((current / target) * 100)) if target else 0
    return {
        "key": key,
        "icon": icon,
        "title": title,
        "description": description,
        "category": category,
        "current": current,
        "target": target,
        "progress": progress,
        "xp": xp,
        "unlocked": unlocked,
    }


def build_progression(user):
    bookings = list(_completed_bookings(user))
    completed = len(bookings)
    total_minutes = sum(item.duration_minutes for item in bookings)
    total_hours = total_minutes / 60

    partners = set()
    for booking in bookings:
        swap = booking.swap
        partners.add(swap.recipient_id if swap.requester_id == user.id else swap.requester_id)

    skills = UserSkill.objects.filter(user=user)
    teach_count = skills.filter(kind=UserSkill.Kind.TEACH).count()
    learn_count = skills.filter(kind=UserSkill.Kind.LEARN).count()

    received = Review.objects.filter(reviewee=user)
    reviews_received = received.count()
    five_star_reviews = received.filter(overall_rating=5).count()
    reviews_written = Review.objects.filter(reviewer=user).count()

    current_streak, best_streak = _weekly_streak(bookings)

    achievements = [
        _achievement("first-swap", "🤝", "First Swap", "Complete your first SkillSwap.", completed, 1, 100, "Journey"),
        _achievement("skill-mentor", "🎓", "Skill Mentor", "Complete 5 teaching exchanges.", completed, 5, 250, "Teaching"),
        _achievement("knowledge-builder", "🧠", "Knowledge Builder", "Reach 10 hours of completed SkillSwaps.", round(total_hours, 1), 10, 300, "Learning"),
        _achievement("network-builder", "🌐", "Network Builder", "Learn with 5 different people.", len(partners), 5, 250, "Community"),
        _achievement("five-star-energy", "⭐", "Five-Star Energy", "Receive 5 five-star reviews.", five_star_reviews, 5, 300, "Reputation"),
        _achievement("skill-collector", "🌱", "Skill Collector", "Add 5 skills you want to learn.", learn_count, 5, 180, "Learning"),
        _achievement("multi-skill-teacher", "🛠️", "Multi-Skill Teacher", "Offer 5 different skills to the community.", teach_count, 5, 180, "Teaching"),
        _achievement("community-voice", "💬", "Community Voice", "Write 5 reviews after completed swaps.", reviews_written, 5, 150, "Community"),
        _achievement("streak-starter", "🔥", "Streak Starter", "Complete SkillSwaps in 3 consecutive weeks.", current_streak, 3, 220, "Momentum"),
        _achievement("unstoppable", "⚡", "Unstoppable", "Reach a 6-week SkillSwap streak.", current_streak, 6, 450, "Momentum"),
        _achievement("swap-veteran", "🏆", "Swap Veteran", "Complete 25 SkillSwaps.", completed, 25, 700, "Journey"),
    ]

    unlocked = [item for item in achievements if item["unlocked"]]
    earned_achievement_xp = sum(item["xp"] for item in unlocked)

    activity_xp = (
        completed * 80
        + reviews_received * 20
        + reviews_written * 15
        + teach_count * 20
        + learn_count * 15
        + min(len(partners), 20) * 15
    )
    xp = activity_xp + earned_achievement_xp

    level = LEVELS[0]
    next_level = None
    for item in LEVELS:
        if xp >= item["min_xp"]:
            level = item
        elif next_level is None:
            next_level = item
            break

    if next_level:
        span = next_level["min_xp"] - level["min_xp"]
        level_progress = round(((xp - level["min_xp"]) / span) * 100) if span else 100
        xp_to_next = max(0, next_level["min_xp"] - xp)
    else:
        level_progress = 100
        xp_to_next = 0

    locked = sorted(
        [item for item in achievements if not item["unlocked"]],
        key=lambda item: (-item["progress"], item["target"]),
    )

    return {
        "xp": xp,
        "level": level,
        "next_level": next_level,
        "level_progress": max(0, min(100, level_progress)),
        "xp_to_next": xp_to_next,
        "current_streak": current_streak,
        "best_streak": best_streak,
        "completed_swaps": completed,
        "total_hours": round(total_hours, 1),
        "unique_partners": len(partners),
        "achievements_unlocked": len(unlocked),
        "achievements_total": len(achievements),
        "unlocked": unlocked,
        "next_achievements": locked[:4],
        "achievements": achievements,
    }
