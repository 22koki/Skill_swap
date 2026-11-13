from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from skills.models import Skill
from circles.models import SkillCircle
from .models import Bookmark, Collection


class BookmarkAPITests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="pass")
        self.other = User.objects.create_user(username="other", password="pass")
        self.skill = Skill.objects.create(name="Watercolor")
        self.client = APIClient()
        self.client.force_authenticate(self.owner)

    def test_save_only_once_and_remove(self):
        payload = {"target_type": "skill", "target_id": self.skill.id}
        self.assertEqual(self.client.post("/api/bookmarks/", payload, format="json").status_code, 201)
        self.assertEqual(self.client.post("/api/bookmarks/", payload, format="json").status_code, 201)
        self.assertEqual(Bookmark.objects.count(), 1)
        bookmark = Bookmark.objects.get()
        self.assertEqual(self.client.delete(f"/api/bookmarks/{bookmark.id}/").status_code, 204)

    def test_collection_access_is_private(self):
        collection = Collection.objects.create(owner=self.other, name="Private")
        bookmark = Bookmark.objects.create(owner=self.owner, target_type="skill", target_id=self.skill.pk)
        response = self.client.patch(f"/api/bookmarks/{bookmark.id}/", {"collection_ids": [collection.pk]}, format="json")
        self.assertEqual(response.status_code, 400)
        response = self.client.get(f"/api/bookmarks/collections/{collection.id}/")
        self.assertEqual(response.status_code, 404)

    def test_cannot_save_self_or_private_circle(self):
        self.assertEqual(self.client.post("/api/bookmarks/", {"target_type": "user", "target_id": self.owner.id}, format="json").status_code, 400)
        circle = SkillCircle.objects.create(title="Private circle", created_by=self.other, is_public=False)
        self.assertEqual(self.client.post("/api/bookmarks/", {"target_type": "circle", "target_id": circle.id}, format="json").status_code, 400)

    def test_collection_assignment_and_filter(self):
        collection = Collection.objects.create(owner=self.owner, name="Learning")
        response = self.client.post("/api/bookmarks/", {"target_type": "skill", "target_id": self.skill.id, "collection_ids": [collection.id]}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["collection_ids"], [collection.id])
        self.assertEqual(len(self.client.get("/api/bookmarks/?type=skill").data), 1)
        self.assertEqual(len(self.client.get("/api/bookmarks/?type=circle").data), 0)
