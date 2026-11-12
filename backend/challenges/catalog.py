# Public, versioned challenge definitions. Participation and progress live in the database.
CHALLENGES = (
    {
        "slug": "consistent-learner",
        "title": "7-Day Learning Spark",
        "subtitle": "Show up for yourself, one day at a time.",
        "icon": "🔥",
        "kind": "active_days",
        "target": 5,
        "duration_days": 7,
        "xp": 120,
        "badge": "Consistency Spark",
        "color": "sunset",
    },
    {
        "slug": "milestone-momentum",
        "title": "Milestone Momentum",
        "subtitle": "Turn your learning goals into real progress.",
        "icon": "🎯",
        "kind": "milestones",
        "target": 5,
        "duration_days": 14,
        "xp": 150,
        "badge": "Goal Getter",
        "color": "lavender",
    },
    {
        "slug": "project-showcase",
        "title": "Project Spotlight",
        "subtitle": "Share projects you've built with fellow learners.",
        "icon": "🚀",
        "kind": "projects",
        "target": 2,
        "duration_days": 14,
        "xp": 100,
        "badge": "Maker Spotlight",
        "color": "mint",
    },
)

BY_SLUG = {challenge["slug"]: challenge for challenge in CHALLENGES}
