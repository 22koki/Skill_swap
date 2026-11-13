from datetime import datetime, timedelta

from django.db.models import Q
from django.utils import timezone

from users.models import AvailabilitySlot
from .models import Booking


def _booking_end(booking):
    return booking.starts_at + timedelta(minutes=booking.duration_minutes)


def _circle_session_end(session):
    return session.starts_at + timedelta(minutes=session.duration_minutes)


def user_conflicts(user, starts_at, duration_minutes, exclude_booking_id=None):
    from circles.models import CircleSession

    ends_at = starts_at + timedelta(minutes=duration_minutes)
    conflicts = []

    bookings = Booking.objects.filter(
        Q(swap__requester=user) | Q(swap__recipient=user),
        status=Booking.Status.SCHEDULED,
    ).select_related("swap__offered_skill", "swap__requested_skill")
    if exclude_booking_id:
        bookings = bookings.exclude(pk=exclude_booking_id)

    for booking in bookings:
        if starts_at < _booking_end(booking) and ends_at > booking.starts_at:
            conflicts.append({
                "type": "skillswap",
                "id": booking.id,
                "starts_at": booking.starts_at.isoformat(),
                "ends_at": _booking_end(booking).isoformat(),
                "label": f"{booking.swap.offered_skill.name} ↔ {booking.swap.requested_skill.name}",
            })

    circle_sessions = CircleSession.objects.filter(
        circle__memberships__user=user,
    ).select_related("circle").distinct()

    for session in circle_sessions:
        if starts_at < _circle_session_end(session) and ends_at > session.starts_at:
            conflicts.append({
                "type": "circle",
                "id": session.id,
                "starts_at": session.starts_at.isoformat(),
                "ends_at": _circle_session_end(session).isoformat(),
                "label": session.circle.title,
            })

    return conflicts


def availability_status(user, starts_at, duration_minutes):
    slots = list(AvailabilitySlot.objects.filter(user=user))
    if not slots:
        return {
            "configured": False,
            "available": True,
            "reason": "Availability not configured",
        }

    local_start = timezone.localtime(starts_at)
    local_end = local_start + timedelta(minutes=duration_minutes)

    if local_start.date() != local_end.date():
        return {
            "configured": True,
            "available": False,
            "reason": "Session crosses into another day",
        }

    weekday = local_start.weekday()
    start_time = local_start.time().replace(tzinfo=None)
    end_time = local_end.time().replace(tzinfo=None)

    matching = [
        slot for slot in slots
        if slot.weekday == weekday
        and slot.start_time <= start_time
        and slot.end_time >= end_time
    ]

    return {
        "configured": True,
        "available": bool(matching),
        "reason": "Inside weekly availability" if matching else "Outside weekly availability",
    }


def evaluate_time(user_a, user_b, starts_at, duration_minutes, exclude_booking_id=None):
    a_availability = availability_status(user_a, starts_at, duration_minutes)
    b_availability = availability_status(user_b, starts_at, duration_minutes)
    a_conflicts = user_conflicts(user_a, starts_at, duration_minutes, exclude_booking_id)
    b_conflicts = user_conflicts(user_b, starts_at, duration_minutes, exclude_booking_id)

    hard_conflicts = []
    if a_availability["configured"] and not a_availability["available"]:
        hard_conflicts.append("Your saved weekly availability does not include this time.")
    if b_availability["configured"] and not b_availability["available"]:
        hard_conflicts.append("Your partner is unavailable at this time.")
    if a_conflicts:
        hard_conflicts.append("You already have another session at this time.")
    if b_conflicts:
        hard_conflicts.append("Your partner already has another session at this time.")

    if hard_conflicts:
        fit_score = 0
    else:
        configured_count = int(a_availability["configured"]) + int(b_availability["configured"])
        fit_score = 100 if configured_count == 2 else 86 if configured_count == 1 else 72

    return {
        "valid": not hard_conflicts,
        "fit_score": fit_score,
        "messages": hard_conflicts,
        "my_availability": a_availability,
        "partner_availability": b_availability,
        "my_conflicts": a_conflicts,
        "partner_conflicts": b_conflicts,
    }


def shared_availability_windows(user_a, user_b):
    slots_a = list(AvailabilitySlot.objects.filter(user=user_a).order_by("weekday", "start_time"))
    slots_b = list(AvailabilitySlot.objects.filter(user=user_b).order_by("weekday", "start_time"))

    if not slots_a or not slots_b:
        return []

    windows = []
    for left in slots_a:
        for right in slots_b:
            if left.weekday != right.weekday:
                continue
            start = max(left.start_time, right.start_time)
            end = min(left.end_time, right.end_time)
            start_minutes = start.hour * 60 + start.minute
            end_minutes = end.hour * 60 + end.minute
            if end_minutes > start_minutes:
                windows.append({
                    "weekday": left.weekday,
                    "start_time": start,
                    "end_time": end,
                    "minutes": end_minutes - start_minutes,
                })
    return windows


def suggest_times(user_a, user_b, duration_minutes=60, limit=6, exclude_booking_id=None):
    duration_minutes = max(30, min(int(duration_minutes or 60), 180))
    windows = shared_availability_windows(user_a, user_b)
    if not windows:
        return []

    now = timezone.localtime()
    today = now.date()
    suggestions = []

    for days_ahead in range(0, 29):
        date_value = today + timedelta(days=days_ahead)
        weekday = date_value.weekday()

        for window in windows:
            if window["weekday"] != weekday or window["minutes"] < duration_minutes:
                continue

            start_dt = timezone.make_aware(
                datetime.combine(date_value, window["start_time"]),
                timezone.get_current_timezone(),
            )
            window_end = timezone.make_aware(
                datetime.combine(date_value, window["end_time"]),
                timezone.get_current_timezone(),
            )

            cursor = start_dt
            while cursor + timedelta(minutes=duration_minutes) <= window_end:
                if cursor > now + timedelta(minutes=30):
                    evaluation = evaluate_time(
                        user_a,
                        user_b,
                        cursor,
                        duration_minutes,
                        exclude_booking_id=exclude_booking_id,
                    )
                    if evaluation["valid"]:
                        suggestions.append({
                            "starts_at": cursor.isoformat(),
                            "ends_at": (cursor + timedelta(minutes=duration_minutes)).isoformat(),
                            "fit_score": evaluation["fit_score"],
                            "label": cursor.strftime("%a, %b %d · %H:%M"),
                            "duration_minutes": duration_minutes,
                        })
                        if len(suggestions) >= limit:
                            return suggestions
                cursor += timedelta(minutes=30)

    return suggestions
