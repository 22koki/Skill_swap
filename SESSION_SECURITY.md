# SkillSwap session and token security — implementation notes

This branch builds on the security-hardening branch. It improves refresh-token revocation and the WebSocket credential transport.

## What changed

- JWT refresh tokens are tracked in Simple JWT's `token_blacklist` app. Rotation invalidates each previous refresh token (`ROTATE_REFRESH_TOKENS=True` and `BLACKLIST_AFTER_ROTATION=True`).
- `POST /api/auth/logout/` requires a valid bearer access token and a refresh token in `{"refresh":"..."}`. It checks ownership before blacklisting and returns HTTP 204 on success.
- The SPA shares one in-flight refresh request across concurrent API calls and replaces the stored refresh token after rotation. Signing in or out prevents a stale in-flight refresh result from resurrecting the prior browser session.
- Sign-out calls the backend revocation endpoint on a best-effort basis, then clears browser credentials and session state.
- Browser WebSockets send access tokens as `skillswap.jwt.<access token>` in the `Sec-WebSocket-Protocol` request header, **not in the URL**. The server accepts the harmless `skillswap` protocol and validates the credential. Existing query-string token authentication is intentionally removed.

## Local validation

**Important: run migrations before trying login or refresh.** Simple JWT creates blacklist tables.

```powershell
cd backend
python manage.py migrate
python manage.py check
python manage.py test users.test_sessions realtime.test_token_transport
python manage.py test
```

In a separate PowerShell window:

```powershell
cd frontend
npm run build
npm run dev
```

In the browser, log in, open Notifications (activity socket), exchange direct chat messages, visit a Skill Circle, refresh the page, and log out. Check that WebSockets connect successfully, no JWT appears in their URL, and that signing in again succeeds. Verify saved items and other API calls survive an expired access token.

## Remaining risks

1. Refresh and access tokens still live in browser localStorage, which can be read if an attacker executes JavaScript in the app. A future upgrade should consider HttpOnly, SameSite cookies, CSRF protection and dedicated short-lived socket tickets.
2. The WebSocket subprotocol request header still contains a credential. Ensure reverse proxies and APM systems **do not log this header**. It is removed from URLs but not eliminated from the handshake.
3. Sign-out revocation is best-effort: when an access token is expired or the network is unavailable, the request can fail even though the frontend clears its state. Consider a refresh-authenticated revocation endpoint and server-side all-device sessions in a future phase.
4. Old tokens issued before enabling blacklisting remain subject to their normal expiry unless explicitly revoked; review outstanding sessions before launch.
5. Authenticated activity sockets may need a reconnect strategy when access expires during long-running sessions. Explicit reconnect-on-401 or a dedicated socket credential flow is still needed.
6. Run `python manage.py flushexpiredtokens` on a maintenance schedule to purge expired blacklist records.
7. A complete production deployment, threat model, incident response and penetration test have not been done.

These changes **do not constitute a completed security audit or a production security certification**.
