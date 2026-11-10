from django.db import migrations

CATALOG = {
    "Technology": ["Python", "Django", "React", "JavaScript", "HTML & CSS", "SQL", "Git & GitHub"],
    "Creative": ["Photography", "Graphic Design", "Video Editing", "UI/UX Design", "Drawing"],
    "Languages": ["English", "Swahili", "French", "Spanish"],
    "Music": ["Guitar", "Piano", "Singing"],
    "Business": ["Digital Marketing", "Public Speaking", "Excel", "Entrepreneurship"],
    "Lifestyle": ["Cooking", "Fitness", "Baking", "Personal Styling"],
}

ICONS = {
    "Technology": "💻",
    "Creative": "🎨",
    "Languages": "🌍",
    "Music": "🎵",
    "Business": "💼",
    "Lifestyle": "✨",
}

def seed(apps, schema_editor):
    SkillCategory = apps.get_model("skills", "SkillCategory")
    Skill = apps.get_model("skills", "Skill")
    for category_name, skills in CATALOG.items():
        category, _ = SkillCategory.objects.get_or_create(
            name=category_name,
            defaults={"icon": ICONS.get(category_name, "")},
        )
        for name in skills:
            Skill.objects.get_or_create(name=name, defaults={"category": category})

def unseed(apps, schema_editor):
    Skill = apps.get_model("skills", "Skill")
    SkillCategory = apps.get_model("skills", "SkillCategory")
    Skill.objects.filter(name__in=[name for skills in CATALOG.values() for name in skills]).delete()
    SkillCategory.objects.filter(name__in=CATALOG.keys()).delete()

class Migration(migrations.Migration):
    dependencies = [("skills", "0001_initial")]
    operations = [migrations.RunPython(seed, unseed)]
