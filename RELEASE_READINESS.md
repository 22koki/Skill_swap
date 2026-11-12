# SkillSwap release readiness checklist

This branch adds guardrails, **not** a deployed production environment. Do not expose the app publicly until the list below is completed.

## 1. Local verification (Windows PowerShell)

Run from the repository root after switching to `feat/release-readiness`.

```powershell
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
cd ..\frontend
npm run build
```

Open the browser and verify the full journey with **two different accounts**: register, add teach/learn skills, match, request and accept a swap, schedule a booking, chat, complete a session, leave a review, visit Skill Passport, create a goal, complete milestones, join a challenge, earn a badge, save a mentor, join a Circle, post/comment/react in Community, sign out and sign back in.

Cross-account checks: user B must not read/update user A's private goals, collections, messages, or challenge enrollment. Blocking a user should prevent interacting with their community content.

## 2. Production environment

Use the host's secret/environment configuration, never committed credentials.

Backend:
- `DJANGO_DEBUG=False`
- `DJANGO_SECRET_KEY`: high-entropy unique secret
- `DJANGO_ALLOWED_HOSTS`: real backend hostnames (no URL schemes)
- `DJANGO_CORS_ALLOWED_ORIGINS`: exact HTTPS frontend origin(s)
- `DJANGO_CSRF_TRUSTED_ORIGINS`: exact trusted HTTPS origins if required
- `DATABASE_URL`: managed PostgreSQL URL
- `REDIS_URL`: managed Redis URL for cross-worker WebSockets
- `DJANGO_TRUST_PROXY=True`: **only** if deployed behind a trusted HTTPS proxy that overwrites `X-Forwarded-Proto`
- `OPENAI_API_KEY` optional; AI features have a fallback planner

Frontend **build-time** variable:
- `VITE_API_BASE_URL=https://your-api.example.com/api`

Django does not automatically load `.env.example`. Configure variables in your shell or hosting dashboard. For local development, existing defaults still work.

## 3. Hosting steps

1. Provision PostgreSQL and Redis, including backups and access controls.
2. Install backend dependencies and run `python manage.py migrate`.
3. Run `python manage.py check --deploy` **with production environment variables**.
4. Collect static assets (`python manage.py collectstatic --noinput`) and configure your host to serve `STATIC_ROOT`, or add an appropriate static file middleware/server.
5. Serve the ASGI app (`config.asgi:application`) using a production-capable ASGI server behind HTTPS.
6. Build/deploy the Vite frontend with the correct `VITE_API_BASE_URL`.
7. Verify WebSocket connections work over WSS; load test reconnects with multiple instances.
8. Set up structured logging, uptime/error alerts, database backups and restore testing.
9. Run a security review (JWT lifecycle, admin access, CSRF/CORS, moderation, rate limits, file/URL content, dependency audit) and accessibility/mobile checks.
10. Recruit a small beta group; collect feedback before considering an open launch.

## Known limitations / unresolved release blockers

- No production deployment was performed on this branch.
- Release-level rate limits, abuse detection, comprehensive audit logs and monitoring have not been implemented.
- User-generated community posts are text and external links, not uploaded media.
- Challenge XP is calculated from mutable milestones/posts. If these events are deleted or undone, challenge rewards may be recalculated. Immutable reward snapshots would be needed for permanent historical awards.
- The frontend currently stores JWT access and refresh tokens in localStorage. A dedicated security review is required before broad public use.
- External AI and WebSocket workflows need end-to-end production validation.
- The stack of feature PRs (#4–#9) must be merged and tested against `main` in dependency order; this PR builds on those branches.

**Do not treat passing unit tests or a Vite build as a production security approval.**
