# GarageOS

Mobile-first auto workshop management app. FastAPI backend + React frontend, Dockerized.

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI + SQLAlchemy 2.x async + asyncpg |
| Database | PostgreSQL 16 |
| Migrations | Alembic |
| Auth | bcrypt + JWT (python-jose) |
| Frontend | React 18 + Vite + TailwindCSS |
| State | React Query + Zustand |
| WhatsApp | Twilio sandbox (v1) |

## Quick start (Docker)

```bash
# 1. Copy and fill in env vars
cp backend/.env.example backend/.env
# Edit SECRET_KEY and optionally Twilio vars

# 2. Start everything
docker compose up --build

# 3. API is at http://localhost:8000
#    Docs at  http://localhost:8000/docs
```

## Local dev (no Docker)

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]' aiosqlite

# Start Postgres and set DATABASE_URL in .env, then:
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173 (proxies /api to :8000)
```

## Testing

```bash
cd backend
SECRET_KEY=test-key-0123456789abcdef0123456789 DATABASE_URL=sqlite+aiosqlite:///:memory: pytest --tb=short -q
```

## Linting

```bash
cd backend
ruff check app/ tests/ && ruff format app/ tests/
```

## Auth: Mobile + Password

Login uses Pakistani mobile numbers (`03xx` or `+923xx`). All inputs are normalized to
E.164 (`+923xxxxxxxxx`) before storage. No SMS OTP in v1 — add in v2 via Twilio Verify.

## Roles

- `owner` — full access including daily summary, settings, complete/cancel job cards, add mechanics
- `mechanic` — create + update job cards, view history

## Build phases

- [x] Phase 1: Auth + Job Card CRUD
- [ ] Phase 2: History + Invoice generation
- [ ] Phase 3: Daily Summary + Workshop Settings  
- [ ] Phase 4: WhatsApp notifications + polish

All Phase 1 functionality is complete and tested (24/24 tests passing).
