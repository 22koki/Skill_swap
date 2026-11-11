from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def _user_from_token(raw_token):
    from django.contrib.auth import get_user_model

    if not raw_token:
        return AnonymousUser()
    try:
        token = AccessToken(raw_token)
        user_id = token.get("user_id")
        if not user_id:
            return AnonymousUser()
        return get_user_model().objects.get(pk=user_id)
    except Exception:
        return AnonymousUser()


class QueryStringJWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query = parse_qs(scope.get("query_string", b"").decode())
        raw_token = (query.get("token") or [""])[0]
        scope["user"] = await _user_from_token(raw_token)
        return await self.app(scope, receive, send)
