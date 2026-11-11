import json
import os

from django.utils import timezone


def _clean_list(values, fallback=None, limit=6):
    items = []
    for value in values or []:
        text = str(value).strip()
        if text and text not in items:
            items.append(text)
        if len(items) >= limit:
            break
    return items or list(fallback or [])


def _fallback_recap(skill, goal, notes, completed_items, pending_items, confidence, challenge, progress):
    confidence = max(1, min(int(confidence or 3), 5))
    progress = max(0, min(int(progress or 0), 100))
    completed_count = len(completed_items)
    pending_count = len(pending_items)
    total = completed_count + pending_count
    checklist_score = round((completed_count / total) * 100) if total else progress
    mastery_score = round((progress * 0.55) + (checklist_score * 0.25) + ((confidence / 5) * 100 * 0.20))
    mastery_score = max(10, min(100, mastery_score))

    goal_text = goal.strip() or f"Build practical confidence with {skill}."
    challenge_text = challenge.strip() or "Keep turning the session ideas into independent practice."
    notes_text = notes.strip()

    highlights = []
    if completed_items:
        highlights.extend([f"Completed: {item}" for item in completed_items[:3]])
    if notes_text:
        highlights.append("Captured shared notes and takeaways from the session.")
    if not highlights:
        highlights = [
            f"Worked through a focused {skill} learning session.",
            f"Built practical momentum toward: {goal_text}",
        ]

    revisit = [item for item in pending_items[:3]]
    if challenge_text and challenge_text not in revisit:
        revisit.append(challenge_text)
    if not revisit:
        revisit = [f"Repeat the hardest {skill} exercise once without guidance."]

    practice = [
        f"Spend 20–30 minutes repeating one {skill} exercise from the session.",
        f"Create one small real-world example connected to: {goal_text}",
        "Write down one question or mistake to discuss in the next SkillSwap.",
    ]

    next_focus = {
        "title": f"Independent {skill} practice",
        "why": "The fastest next step is to turn guided understanding into something you can do without prompts.",
        "challenge": f"Complete a small {skill} task from start to finish, then compare the result with the success criteria from your learning plan.",
    }

    if mastery_score >= 80:
        momentum = "Ready to stretch"
        next_focus = {
            "title": f"Apply {skill} in a real project",
            "why": "Your session signals show strong momentum. A realistic project will expose the next useful gaps.",
            "challenge": f"Build or complete one small project using {skill} and ask your partner for targeted feedback.",
        }
    elif mastery_score >= 55:
        momentum = "Building confidence"
    else:
        momentum = "Foundation in progress"

    return {
        "title": f"{skill} Session Recap",
        "summary": f"You made progress toward “{goal_text}”. The next priority is consistent practice and closing the remaining gaps.",
        "skill": skill,
        "goal": goal_text,
        "mastery_score": mastery_score,
        "momentum": momentum,
        "confidence": confidence,
        "highlights": highlights,
        "concepts_strengthened": _clean_list(
            completed_items,
            [f"Core {skill} concepts", "Guided practice", "Feedback and correction"],
            5,
        ),
        "revisit": _clean_list(revisit, limit=5),
        "practice_next": practice,
        "next_focus": next_focus,
        "next_skill_goal": f"Move from guided {skill} practice to confident independent use.",
        "coach_note": "Keep the next practice small enough to finish, but difficult enough that you need to think.",
        "generated_at": timezone.now().isoformat(),
    }


def _normalize_recap(data, fallback):
    if not isinstance(data, dict):
        return fallback
    next_focus = data.get("next_focus") if isinstance(data.get("next_focus"), dict) else {}
    try:
        mastery = int(data.get("mastery_score", fallback["mastery_score"]))
    except (TypeError, ValueError):
        mastery = fallback["mastery_score"]

    return {
        "title": str(data.get("title") or fallback["title"]).strip()[:160],
        "summary": str(data.get("summary") or fallback["summary"]).strip()[:700],
        "skill": str(data.get("skill") or fallback["skill"]).strip()[:120],
        "goal": str(data.get("goal") or fallback["goal"]).strip()[:500],
        "mastery_score": max(0, min(100, mastery)),
        "momentum": str(data.get("momentum") or fallback["momentum"]).strip()[:80],
        "confidence": fallback["confidence"],
        "highlights": _clean_list(data.get("highlights"), fallback["highlights"], 6),
        "concepts_strengthened": _clean_list(data.get("concepts_strengthened"), fallback["concepts_strengthened"], 6),
        "revisit": _clean_list(data.get("revisit"), fallback["revisit"], 6),
        "practice_next": _clean_list(data.get("practice_next"), fallback["practice_next"], 6),
        "next_focus": {
            "title": str(next_focus.get("title") or fallback["next_focus"]["title"]).strip()[:160],
            "why": str(next_focus.get("why") or fallback["next_focus"]["why"]).strip()[:500],
            "challenge": str(next_focus.get("challenge") or fallback["next_focus"]["challenge"]).strip()[:500],
        },
        "next_skill_goal": str(data.get("next_skill_goal") or fallback["next_skill_goal"]).strip()[:300],
        "coach_note": str(data.get("coach_note") or fallback["coach_note"]).strip()[:400],
        "generated_at": timezone.now().isoformat(),
    }


def generate_session_recap(
    skill,
    goal,
    notes,
    completed_items,
    pending_items,
    confidence,
    challenge,
    progress,
    plan=None,
):
    fallback = _fallback_recap(
        skill, goal, notes, completed_items, pending_items, confidence, challenge, progress
    )
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return fallback, "fallback"

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        model = os.getenv("OPENAI_MODEL", "gpt-6-luna").strip() or "gpt-6-luna"
        prompt = f"""
Create a post-session SkillSwap learning recap for the learner.

Skill learned: {skill}
Original goal: {goal or 'Build practical confidence'}
Learner confidence after session (1-5): {confidence}
Learner reflection / challenge: {challenge or 'Not provided'}
Shared notes: {notes or 'No shared notes were written'}
Completed checklist items: {json.dumps(completed_items)}
Incomplete checklist items: {json.dumps(pending_items)}
Workspace progress percentage: {progress}
Learning plan context: {json.dumps(plan or {})[:6000]}

Return JSON only:
{{
  "title": "string",
  "summary": "string",
  "skill": "string",
  "goal": "string",
  "mastery_score": 0,
  "momentum": "string",
  "highlights": ["string"],
  "concepts_strengthened": ["string"],
  "revisit": ["string"],
  "practice_next": ["string"],
  "next_focus": {{
    "title": "string",
    "why": "string",
    "challenge": "string"
  }},
  "next_skill_goal": "string",
  "coach_note": "string"
}}

Rules:
- Be encouraging but evidence-based; do not claim mastery that the session data does not support.
- Give concrete practice tasks.
- Use the learner's actual goal, notes, checklist, and reflection.
- The mastery score is a learning-progress estimate, not a certification.
- The next focus should be achievable before the learner's next swap.
"""
        response = client.responses.create(
            model=model,
            instructions="You create concise, practical learning recaps. Return valid JSON only.",
            input=prompt,
            text={"format": {"type": "json_object"}},
        )
        data = json.loads(response.output_text)
        return _normalize_recap(data, fallback), "openai"
    except Exception:
        return fallback, "fallback"


def recap_tasks(recap):
    tasks = []
    for item in (recap or {}).get("practice_next", []):
        text = str(item).strip()
        if text:
            tasks.append("Next practice — " + text)

    focus = (recap or {}).get("next_focus") or {}
    challenge = str(focus.get("challenge") or "").strip()
    if challenge:
        tasks.append("Next focus — " + challenge)

    return tasks[:8]
