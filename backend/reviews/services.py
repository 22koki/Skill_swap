from django.db.models import Avg, Count
from users.models import Profile
from .models import Review

def update_reputation(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    stats = Review.objects.filter(reviewee=user).aggregate(
        review_count=Count("id"),
        overall=Avg("overall_rating"),
        teaching=Avg("teaching_quality"),
        communication=Avg("communication"),
        reliability=Avg("reliability"),
        friendliness=Avg("friendliness"),
        swap_again=Avg("would_swap_again"),
    )

    profile.review_count = stats["review_count"] or 0
    profile.average_rating = round(stats["overall"] or 0, 2)
    profile.teaching_rating = round(stats["teaching"] or 0, 2)
    profile.communication_rating = round(stats["communication"] or 0, 2)
    profile.reliability_rating = round(stats["reliability"] or 0, 2)
    profile.friendliness_rating = round(stats["friendliness"] or 0, 2)
    profile.would_swap_again_percent = round((stats["swap_again"] or 0) * 100)
    profile.save(update_fields=[
        "review_count", "average_rating", "teaching_rating",
        "communication_rating", "reliability_rating", "friendliness_rating",
        "would_swap_again_percent",
    ])
    return profile

def reputation_badges(profile):
    badges = []
    if profile.completed_swaps >= 1:
        badges.append({"key":"first-swap","label":"First Swap","icon":"🤝"})
    if profile.review_count >= 3 and profile.teaching_rating >= 4.5:
        badges.append({"key":"great-teacher","label":"Great Teacher","icon":"🎓"})
    if profile.review_count >= 3 and profile.reliability_rating >= 4.5:
        badges.append({"key":"reliable","label":"Reliable Swapper","icon":"🛡️"})
    if profile.review_count >= 3 and profile.communication_rating >= 4.5:
        badges.append({"key":"communicator","label":"Great Communicator","icon":"💬"})
    if profile.review_count >= 5 and profile.average_rating >= 4.7:
        badges.append({"key":"favorite","label":"Community Favorite","icon":"⭐"})
    if profile.completed_swaps >= 10:
        badges.append({"key":"ten-swaps","label":"10+ Swaps","icon":"🏆"})
    return badges
