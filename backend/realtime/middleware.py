from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


@database_sync_to_async
def get_user_from_token(raw_token):
    if not raw_token:
        return AnonymousUser()
    try:
        auth = JWTAuthentication()
        validated = auth.get_validated_token(raw_token)
        return auth.get_user(validated)
    except (InvalidToken, TokenError, Exception):
        return AnonymousUser()


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # Do not accept credentials in the URL query string: URLs are routinely
        # logged by proxies. Browsers can send subprotocols during the WS handshake.
        # The server only echoes the harmless "skillswap" protocol on accept.
        protocols = scope.get("subprotocols") or []
        token_protocols = [part for part in protocols if part.startswith("skillswap.jwt.")]
        token = token_protocols[0][len("skillswap.jwt."):] if len(token_protocols) == 1 else ""
        scope["user"] = await get_user_from_token(token)
        return await self.app(scope, receive, send)
