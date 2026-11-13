from unittest.mock import AsyncMock, patch

from asgiref.sync import async_to_sync
from django.contrib.auth.models import AnonymousUser
from django.test import SimpleTestCase

from .middleware import JWTAuthMiddleware


class WebSocketCredentialTransportTests(SimpleTestCase):
    def test_subprotocol_token_is_forwarded_to_validator(self):
        captured = {}

        async def app(scope, receive, send):
            captured.update(scope)

        middleware = JWTAuthMiddleware(app)
        with patch("realtime.middleware.get_user_from_token", new_callable=AsyncMock) as validate:
            validate.return_value = "validated-user"
            async_to_sync(middleware)(
                {"type": "websocket", "query_string": b"", "subprotocols": ["skillswap", "skillswap.jwt.example.jwt.token"]},
                None, None,
            )
            validate.assert_awaited_once_with("example.jwt.token")
        self.assertEqual(captured["user"], "validated-user")

    def test_query_string_credentials_are_ignored(self):
        async def app(scope, receive, send):
            self.assertIsInstance(scope["user"], AnonymousUser)

        middleware = JWTAuthMiddleware(app)
        with patch("realtime.middleware.get_user_from_token", new_callable=AsyncMock) as validate:
            validate.return_value = AnonymousUser()
            async_to_sync(middleware)(
                {"type": "websocket", "query_string": b"token=leaked", "subprotocols": []},
                None, None,
            )
            validate.assert_awaited_once_with("")
