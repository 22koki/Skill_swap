import json
import os

from django.utils import timezone


LEARNING_STYLE_LABELS = {
    "practical": "Practical",
    "theory_first": "Theory first",
    "project_based": "Project-based",
    "fast_paced": "Fast-paced",
    "step_by_step": "Step-by-step",
}


def _clean_list(values, fallback=None, limit=6):
    items = []
    for value in values or []:
        text = str(value).strip()
        if text and text not in items:
            items.append(text)
        if len(items) >= limit:
            break
    return items or list(fallback or [])


def _fallback_plan(skill, goal, learner_level, learning_style, session_count, duration_minutes):
    session_count = max(1, min(int(session_count or 3), 6))
    duration_minutes = max(30, min(int(duration_minutes or 60), 180))
    style = LEARNING_STYLE_LABELS.get(learning_style, "Step-by-step")
    goal_text = goal.strip() or f"Build confidence with {skill} through guided practice."

    phases = [
        ("Foundations", "Understand the core ideas and vocabulary."),
        ("Guided Practice", "Apply the fundamentals with support."),
        ("Real-world Practice", "Use the skill in realistic examples."),
        ("Mini Project", "Combine the key ideas into something tangible."),
        ("Feedback & Refinement", "Identify weak points and improve technique."),
        ("Independent Challenge", "Finish with a task the learner can repeat alone."),
    ]

    sessions = []
    for index in range(session_count):
        title, objective = phases[index]
        sessions.append({
            "number": index + 1,
            "title": title,
            "objective": f"{objective} Focus on {skill}.",
            "minutes": duration_minutes,
            "topics": [
                f"{skill} essentials for a {learner_level} learner",
                f"Common mistakes and useful shortcuts",
                f"How this session connects to: {goal_text}",
            ],
            "activities": [
                "5-minute goal check and quick recap",
                f"Teacher demo or explanation using a {style.lower()} approach",
                "Learner completes a guided exercise",
                "Short feedback round and questions",
            ],
            "practice_task": f"Complete one small {skill} exercise before the next session and note what felt difficult.",
            "success_check": f"Learner can explain and demonstrate the main idea from {title.lower()} without step-by-step prompting.",
        })

    return {
        "title": f"{skill} SkillSwap Roadmap",
        "summary": f"A {session_count}-session {style.lower()} roadmap designed around the goal: {goal_text}",
        "learner_level": learner_level,
        "target_level": "Confident " + learner_level if learner_level != "expert" else "Advanced independent practice",
        "goal": goal_text,
        "learning_style": learning_style,
        "learning_style_label": style,
        "session_count": session_count,
        "estimated_total_minutes": session_count * duration_minutes,
        "sessions": sessions,
        "resource_ideas": [
            f"A concise {skill} beginner reference or cheat sheet",
            f"One high-quality worked example for {skill}",
            f"A small practice project related to: {goal_text}",
        ],
        "next_steps": [
            f"Repeat the strongest exercise from the roadmap independently.",
            f"Choose one real-world {skill} project to continue after the swap.",
            "Ask your partner for one final piece of feedback and one stretch goal.",
        ],
        "generated_at": timezone.now().isoformat(),
    }


def _normalize_plan(plan, skill, goal, learner_level, learning_style, session_count, duration_minutes):
    fallback = _fallback_plan(skill, goal, learner_level, learning_style, session_count, duration_minutes)
    if not isinstance(plan, dict):
        return fallback

    sessions = []
    for index, raw in enumerate(plan.get("sessions") or []):
        if not isinstance(raw, dict):
            continue
        sessions.append({
            "number": index + 1,
            "title": str(raw.get("title") or f"Session {index + 1}").strip()[:120],
            "objective": str(raw.get("objective") or "").strip()[:320],
            "minutes": max(30, min(int(raw.get("minutes") or duration_minutes or 60), 180)),
            "topics": _clean_list(raw.get("topics"), limit=5),
            "activities": _clean_list(raw.get("activities"), limit=6),
            "practice_task": str(raw.get("practice_task") or "").strip()[:500],
            "success_check": str(raw.get("success_check") or "").strip()[:500],
        })

    wanted = max(1, min(int(session_count or 3), 6))
    if not sessions:
        sessions = fallback["sessions"]
    sessions = sessions[:wanted]

    return {
        "title": str(plan.get("title") or fallback["title"]).strip()[:160],
        "summary": str(plan.get("summary") or fallback["summary"]).strip()[:600],
        "learner_level": str(plan.get("learner_level") or learner_level).strip()[:40],
        "target_level": str(plan.get("target_level") or fallback["target_level"]).strip()[:80],
        "goal": str(plan.get("goal") or fallback["goal"]).strip()[:500],
        "learning_style": learning_style,
        "learning_style_label": LEARNING_STYLE_LABELS.get(learning_style, fallback["learning_style_label"]),
        "session_count": len(sessions),
        "estimated_total_minutes": sum(item["minutes"] for item in sessions),
        "sessions": sessions,
        "resource_ideas": _clean_list(plan.get("resource_ideas"), fallback["resource_ideas"], 5),
        "next_steps": _clean_list(plan.get("next_steps"), fallback["next_steps"], 5),
        "generated_at": timezone.now().isoformat(),
    }


def generate_learning_plan(skill, goal, learner_level, learning_style, session_count, duration_minutes, partner_context=""):
    fallback = _fallback_plan(skill, goal, learner_level, learning_style, session_count, duration_minutes)
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return fallback, "fallback"

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        model = os.getenv("OPENAI_MODEL", "gpt-6-luna").strip() or "gpt-6-luna"
        prompt = f"""
Create a concise, practical SkillSwap learning roadmap.

Skill the learner wants to learn: {skill}
Current learner level: {learner_level}
Goal: {goal or 'Build practical confidence'}
Preferred learning style: {LEARNING_STYLE_LABELS.get(learning_style, learning_style)}
Number of sessions: {session_count}
Minutes per session: {duration_minutes}
Partner context: {partner_context or 'Two peers exchanging skills'}

Return JSON only with this exact top-level structure:
{{
  "title": "string",
  "summary": "string",
  "learner_level": "string",
  "target_level": "string",
  "goal": "string",
  "sessions": [
    {{
      "title": "string",
      "objective": "string",
      "minutes": 60,
      "topics": ["string"],
      "activities": ["string"],
      "practice_task": "string",
      "success_check": "string"
    }}
  ],
  "resource_ideas": ["string"],
  "next_steps": ["string"]
}}

Rules:
- Create exactly {session_count} sessions.
- Make each session achievable within {duration_minutes} minutes.
- Avoid vague advice. Each session needs a concrete learner activity and success check.
- Do not invent URLs or specific paid resources.
- Keep the plan friendly for peer-to-peer learning rather than formal classroom teaching.
"""

        response = client.responses.create(
            model=model,
            instructions="You design practical peer-to-peer learning plans. Return valid JSON only.",
            input=prompt,
            text={"format": {"type": "json_object"}},
        )
        raw = json.loads(response.output_text)
        return _normalize_plan(raw, skill, goal, learner_level, learning_style, session_count, duration_minutes), "openai"
    except Exception:
        return fallback, "fallback"


def checklist_items_from_plan(plan):
    items = []
    for session in (plan or {}).get("sessions", []):
        number = session.get("number")
        title = session.get("title")
        success = str(session.get("success_check") or "").strip()
        practice = str(session.get("practice_task") or "").strip()
        prefix = f"Session {number}: {title}" if number and title else str(title or "AI plan task")
        if success:
            items.append(f"{prefix} — {success}")
        if practice:
            items.append(f"{prefix} practice — {practice}")
    return items[:18]
