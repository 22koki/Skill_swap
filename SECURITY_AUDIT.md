# SkillSwap Security Audit — Phase 1

## Changes in this branch

1. **Authentication abuse protection** — JWT login, token refresh and account registration have scoped DRF rate limits. Production uses shared Redis-backed Django cache, so limits apply across workers.
2. **Public profile privacy** — public profile responses no longer expose email addresses or staff flags. Account holders still access their own private details via `/api/auth/me/`. Blocked accounts cannot fetch one another's public profiles while authenticated.
3. **Private Circle isolation** — unrelated authenticated users can no longer enumerate or view private Circles. An uninvited account cannot self-join a private Circle by guessing its ID.
4. **Privilege escalation** — self-joining a Circle can no longer request or replace membership with the `mentor` role. Existing authorized Circle mentors can still promote users through the moderation endpoint.
5. **Members-only session details** — public Circle discovery hides full session schedules with meeting links, internal resources, tasks, and AI plans unless the viewer is a member or creator.
6. **Session-aware Saved panel** — uses the app's central API helper, including access-token refresh and deployment-configured API host.

## Verification

From `backend` run:

```powershell
python manage.py check
python manage.py test users.test_security circles.test_security
python manage.py test
```

From `frontend` run:

```powershell
npm run build
npm run dev
```

Browser smoke test: use two logged-in accounts, test public profile visibility, Circle join + mentor moderation, private Circle access, Saved bookmarks after token expiry, and login throttling (avoid testing repeated real-account failures).

## Important remaining risks (not yet fixed)

- JWT tokens are stored in browser `localStorage`, which increases the impact of XSS. A future session model review should consider HttpOnly cookies with CSRF defenses and safe refresh-token rotation.
- WebSocket JWT access tokens currently travel in query strings and could appear in access logs. Move to a more protected handshake or carefully controlled short-lived connection tokens.
- DRF IP-scoped throttling is a first layer, not a complete bot/credential-stuffing defense. Configure proxy IP trust properly, edge limits and monitoring.
- Old refresh tokens can remain valid because blacklist enforcement is disabled. Plan refresh rotation/blacklisting and logout revocation.
- Other application endpoints still need systematic authorization and object-level permission coverage, particularly booking, reviews, WebSocket consumers and moderation.
- More comprehensive audit logging, dependency scanning, security headers review and a professional pentest are needed prior to public launch.
- Users should be given a safe invitation flow before creating actively used private Circles. Unrelated accounts are intentionally blocked from self-joining them.

**Do not consider this branch a complete security certification or production authorization.**
