from rest_framework import serializers
from .models import Skill, SkillCategory, UserSkill

class SkillCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillCategory
        fields = ["id", "name", "icon"]

class SkillSerializer(serializers.ModelSerializer):
    category = SkillCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=SkillCategory.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Skill
        fields = ["id", "name", "description", "category", "category_id"]

class UserSkillSerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)
    skill_id = serializers.PrimaryKeyRelatedField(
        source="skill",
        queryset=Skill.objects.all(),
        write_only=True,
    )

    class Meta:
        model = UserSkill
        fields = ["id", "skill", "skill_id", "kind", "level", "description"]
