from django.db.models import Q
from django.utils import timezone

from .models import AccountStanding, UserBlock


def hidden_user_ids(user):
    if not user or not user.is_authenticated:
        return set()
    outbound = UserBlock.objects.filter(blocker=user).values_list("blocked_id", flat=True)
    inbound = UserBlock.objects.filter(blocked=user).values_list("blocker_id", flat=True)
    return set(outbound).union(inbound)


def is_blocked_between(user_a, user_b):
    if not user_a or not user_b:
        return False
    if not getattr(user_a, "is_authenticated", False) or not getattr(user_b, "is_authenticated", False):
        return False
    if user_a.id == user_b.id:
        return False
    return UserBlock.objects.filter(
        Q(blocker=user_a, blocked=user_b) | Q(blocker=user_b, blocked=user_a)
    ).exists()


def standing_for(user):
    if not user or not getattr(user, "is_authenticated", False):
        return None
    standing, _ = AccountStanding.objects.get_or_create(user=user)
    return standing


def restriction_reason(user):
    standing = standing_for(user)
    if not standing:
        return ""
    if standing.suspended:
        return "This account is suspended from SkillSwap interactions."
    if standing.restricted_until and standing.restricted_until > timezone.now():
        return f"This account is temporarily restricted until {standing.restricted_until.isoformat()}."
    return ""


def interaction_block_reason(actor, target=None):
    reason = restriction_reason(actor)
    if reason:
        return reason
    if target:
        target_reason = restriction_reason(target)
        if target_reason:
            return "This user is currently unavailable for SkillSwap interactions."
        if is_blocked_between(actor, target):
            return "This interaction is unavailable because one of these users has blocked the other."
    return ""


def can_interact(actor, target=None):
    return not bool(interaction_block_reason(actor, target))
