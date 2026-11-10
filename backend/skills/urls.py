from django.urls import path
from .views import (
    SkillListView,
    SkillCategoryListView,
    MySkillListCreateView,
    MySkillDetailView,
    MatchListView,
)

urlpatterns = [
    path("", SkillListView.as_view(), name="skill-list"),
    path("categories/", SkillCategoryListView.as_view(), name="skill-category-list"),
    path("mine/", MySkillListCreateView.as_view(), name="my-skills"),
    path("mine/<int:pk>/", MySkillDetailView.as_view(), name="my-skill-detail"),
    path("matches/", MatchListView.as_view(), name="matches"),
]
