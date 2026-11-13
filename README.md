<div align="center">

# ↔ SkillSwap

### Swap skills. Grow together.

**A collaborative learning platform where people exchange what they know for what they want to learn.**

[**Explore the live beta**](https://skillswap-koki.netlify.app/) · [**API health**](https://skillswap-beta-api-olso.onrender.com/api/health/) · [**Report an issue**](https://github.com/22koki/Skill_swap/issues)

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Django](https://img.shields.io/badge/Django-REST-092E20?logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-realtime-DC382D?logo=redis&logoColor=white)
![Status](https://img.shields.io/badge/status-closed%20beta-845EF7)

</div>

---

## The idea

Traditional learning can be expensive, isolating, or hard to access. **SkillSwap** takes a different approach: everyone has something worth teaching, and everyone has something new to learn.

Teach a skill you already have, discover someone with complementary knowledge, propose an exchange, schedule a session, and grow together. SkillSwap brings the entire process into one place—from discovery to conversation, learning plans, progress, and feedback.

> **Example:** You can teach someone React while they help you learn graphic design. Both people exchange skills rather than paying for a class.

## Try SkillSwap

**Live frontend:** https://skillswap-koki.netlify.app/

**Backend health check:** https://skillswap-beta-api-olso.onrender.com/api/health/

SkillSwap is currently running as a **closed beta**. Its hosted infrastructure uses free-tier resources, so first visits may be slower while services wake up. The free beta PostgreSQL instance is temporary, not a long-term data-storage guarantee. Please use test accounts and avoid entering sensitive or irreplaceable information.

### See it in action

Screenshots and a short walkthrough video are planned for this section. Add actual captures of the live app under `docs/screenshots/` and replace this note with an image gallery. Suggested scenes: discovery and matching, swap proposals, live chat, scheduling, Skill Passport, and learning progress. No mock screenshots are presented as real product images.

## Features

| Experience | What you can do |
| --- | --- |
| 🧠 **Skill discovery and matching** | List skills you teach and want to learn; explore suggested skill-exchange partners and the Skill Network. |
| 🤝 **Swap proposals** | Send, receive, accept, decline, or cancel exchange proposals with other users. |
| 📅 **Scheduling and sessions** | Check availability, schedule sessions, manage bookings, and propose rescheduling. |
| 💬 **Real-time chat** | Message your swap partner over WebSockets, with messages stored for later viewing. |
| 🔔 **Notifications** | Receive swap and activity notifications, track unread updates, and control notification preferences. |
| ⭐ **Reviews and Skill Passport** | Complete sessions, leave reviews, and explore learning history and profile progress. |
| 🎯 **Learning and productivity** | Work with shared session workspaces, goals, checklists, learning challenges, and achievement progress. |
| 👥 **Community and Skill Circles** | Join discussion spaces, connect with other learners, and participate in group learning. |
| ✨ **AI-assisted workflows** | Generate learning plans and session recaps; some features have a non-AI fallback when an API key is absent. |
| 🛡️ **Trust and safety** | Blocking, reporting, moderation tools, JWT authentication, and access checks for private resources. |

### Live beta checks completed

During hands-on beta testing, the following flows were confirmed: sending a swap proposal, receiving its notification, accepting it and receiving the acceptance notification, real-time chat delivery, messages surviving a page refresh, and opening the review form after completing a session. **Full review submission, all-device/browser coverage, broader security testing, and load testing are not yet claimed as complete.**

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite, JavaScript, CSS |
| Backend | Python, Django, Django REST Framework |
| Authentication | Simple JWT with refresh rotation and token blacklisting |
| Realtime | Django Channels, Daphne, Redis channel layer |
| Database | PostgreSQL in production; SQLite for zero-config local development |
| Infrastructure | Netlify (frontend), Render (API, PostgreSQL, Redis) |
| Static assets | WhiteNoise |
| Optional AI integration | OpenAI API and built-in fallback workflows |

### Architecture

```text
Browser (React / Vite on Netlify)
      | HTTPS REST                  | WSS WebSockets
      +-------------+---------------+
                    |
            Django REST + Channels
                 Daphne / Render
                    |
              +-----+------+
              |            |
         PostgreSQL       Redis
        users, swaps,   realtime and
        bookings, etc.  shared cache
```

The frontend is a separate application. Its production build points `VITE_API_BASE_URL` to the Render API.

## Run locally

### Prerequisites

- Python 3.13 or a compatible supported Python version
- Node.js 22+ and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/22koki/Skill_swap.git
cd Skill_swap
```

### 2. Start the Django API

**Windows PowerShell:**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**macOS / Linux:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

With `DJANGO_DEBUG=True` (the development default), local setup uses SQLite and an in-memory Channels layer. A separate PostgreSQL or Redis instance is **not required for basic local development**.

Test the API: http://127.0.0.1:8000/api/health/

### 3. Start the React frontend

From a **second terminal** at the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL shown in the terminal (normally http://localhost:5173).

The frontend defaults to `http://127.0.0.1:8000/api` if `VITE_API_BASE_URL` is not set. To override it, create `frontend/.env.local` from `frontend/.env.example` and adjust the value.

### 4. Try a complete skill exchange

1. Create two accounts in separate browser profiles.
2. Add skills each account can teach and wants to learn.
3. Discover a compatible user and propose a swap.
4. Accept the request from the other account.
5. Schedule a session and exchange messages.
6. Complete the session and test the review flow.

## Run the checks

From `backend/` with your Python environment active:

```bash
python manage.py check
python manage.py test
python manage.py collectstatic --noinput
```

From `frontend/`:

```bash
npm run build
```

The latest local verification during beta preparation reported **47 passing backend tests** and a successful Vite production build. These results are a snapshot, not a guarantee that every future commit will pass.

## Deploying your own instance

The repository includes:

- [`render.yaml`](render.yaml) — starting point for the Render Django ASGI service
- [`netlify.toml`](netlify.toml) — frontend build configuration
- [`BETA_DEPLOYMENT.md`](BETA_DEPLOYMENT.md) — detailed deployment and acceptance checklist
- [`SESSION_SECURITY.md`](SESSION_SECURITY.md) and [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md) — documented protections and remaining risks

For production-like deployment, set backend values in the **hosting dashboard**, not the repository:

```text
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<unique secret>
DJANGO_ALLOWED_HOSTS=<backend hostname>
DJANGO_CORS_ALLOWED_ORIGINS=<frontend HTTPS origin>
DATABASE_URL=<PostgreSQL connection URL>
REDIS_URL=<Redis connection URL>
DJANGO_TRUST_PROXY=True
```

Set `VITE_API_BASE_URL=https://YOUR_BACKEND/api` as a **frontend build-time environment variable**. Build again after changing it.

Do **not** commit connection strings, access tokens, API keys, or `.env` files. The free hosted beta is a testing environment; a wider release requires durable database hosting, backups, monitoring, and further security verification.

## Project layout

```text
Skill_swap/
├── backend/
│   ├── config/            # Django settings, routes and ASGI configuration
│   ├── users/             # Accounts, profiles, preferences and safety
│   ├── skills/            # Skill catalogs and matching
│   ├── swaps/             # Skill-exchange requests
│   ├── bookings/          # Scheduling and session lifecycle
│   ├── messaging/         # Stored conversations
│   ├── realtime/          # WebSocket routing and auth
│   ├── notifications/     # Activity and notification preferences
│   ├── circles/           # Learning groups
│   ├── workspaces/        # Shared learning workspaces
│   └── ...                # Goals, reviews, community and challenges
├── frontend/
│   └── src/               # React app, panels, components and styles
├── .github/workflows/     # CI configuration
├── render.yaml
└── netlify.toml
```

## Roadmap

- [x] Full-stack application with authenticated skill exchanges
- [x] Live beta hosted on Netlify and Render
- [x] Proposals, notifications, live chat and persistence tested
- [ ] Add verified screenshots and demo video
- [ ] Finish end-to-end beta acceptance and accessibility/mobile QA
- [ ] Complete monitoring, recovery, backup and security reviews
- [ ] Move to durable managed database hosting before a broader launch

## Contributing and feedback

This is an evolving personal project. Bug reports, accessibility feedback, and thoughtful feature suggestions are welcome through [GitHub Issues](https://github.com/22koki/Skill_swap/issues). Please do not post private account information or tokens in public issues.

---

<div align="center">

**Built by [22koki](https://github.com/22koki)**

*Learning is better when everyone brings something to the table.*

[Live beta](https://skillswap-koki.netlify.app/) · [Repository](https://github.com/22koki/Skill_swap) · [Issues](https://github.com/22koki/Skill_swap/issues)

</div>
