from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from users.models import UserBlock
from .models import Post, Reaction, Comment


class CommunityTests(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice")
        self.bob = User.objects.create_user(username="bob")
        self.client = APIClient()
        self.client.force_authenticate(user=self.alice)

    def test_post_and_comment_flow(self):
        response = self.client.post("/api/community/", {"kind":"project","body":"Built a portfolio!"}, format="json")
        self.assertEqual(response.status_code,201)
        post_id=response.data["id"]
        self.assertEqual(self.client.post(f"/api/community/{post_id}/react/").status_code,201)
        self.assertEqual(self.client.post(f"/api/community/{post_id}/react/").status_code,200)
        self.assertEqual(Reaction.objects.count(),1)
        response=self.client.post(f"/api/community/{post_id}/comments/", {"body":"Great work!"},format="json")
        self.assertEqual(response.status_code,201)
        self.assertEqual(self.client.get("/api/community/").data[0]["reaction_count"],1)
        self.assertEqual(self.client.get("/api/community/").data[0]["comment_count"],1)

    def test_cannot_edit_others_posts_or_comments(self):
        post = Post.objects.create(author=self.bob,body="Original")
        comment=Comment.objects.create(post=post,author=self.bob,body="hello")
        self.assertEqual(self.client.patch(f"/api/community/{post.pk}/",{"body":"Hacked"},format="json").status_code,404)
        self.assertEqual(self.client.delete(f"/api/community/{post.pk}/comments/{comment.pk}/").status_code,404)

    def test_blocks_hide_posts_and_interactions(self):
        post=Post.objects.create(author=self.bob,body="Blocked")
        UserBlock.objects.create(blocker=self.alice,blocked=self.bob)
        self.assertEqual(len(self.client.get("/api/community/").data),0)
        self.assertEqual(self.client.post(f"/api/community/{post.id}/react/").status_code,404)
        self.assertEqual(self.client.get(f"/api/community/{post.id}/comments/").status_code,404)

    def test_anonymous_cannot_post(self):
        self.client.force_authenticate(user=None)
        self.assertIn(self.client.post("/api/community/",{"body":"No"},format="json").status_code,(401,403))

    def test_blank_post_rejected(self):
        self.assertEqual(self.client.post("/api/community/",{"body":"    "},format="json").status_code,400)
