# GarageOS

[![CI](https://github.com/NasirNS45/garageOS/actions/workflows/ci.yml/badge.svg)](https://github.com/NasirNS45/garageOS/actions/workflows/ci.yml)

Mobile-first auto workshop management for Pakistani independent repair shops. FastAPI backend + React PWA frontend, Dockerized.

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI + SQLAlchemy 2.x async + asyncpg |
| Database | PostgreSQL 16 |
| Migrations | Alembic |
| Auth | bcrypt + JWT |
| Frontend | React 19 + Vite + TailwindCSS |
| State | React Query + Zustand |
| WhatsApp | Twilio or Meta Cloud API |

## Quick start (Docker)

```bash
cp backend/.env.example backend/.env
# Set SECRET_KEY, DATABASE_URL, WEB_BASE_URL, and WhatsApp credentials

docker compose up --build
# API: http://localhost:8000
# App: http://localhost (nginx)
```

## Local dev

```bash
# Backend
cd backend && alembic upgrade head && uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

## Testing

```bash
cd backend
SECRET_KEY=test-key-0123456789abcdef0123456789 DATABASE_URL=sqlite+aiosqlite:///:memory: pytest --tb=short -q
```

## Features (implemented)

- **Auth:** Signup, login, refresh tokens, password reset via WhatsApp link
- **Jobs:** Create, assign mechanics, parts line items, photos, complete/cancel
- **Customers:** History by plate/phone, top customers, outstanding balance (udhaar-lite)
- **Invoices:** Public invoice + PDF, live job tracker
- **WhatsApp:** Check-in, completion, service reminders, daily digest, password reset
- **Owner tools:** Summary (day/week/month), expenses, CSV export, team management
- **Localization:** English + Urdu (dashboard, auth pages, landing hero)
- **PWA:** Installable app with basic offline shell

## WhatsApp configuration

Set `WHATSAPP_PROVIDER=twilio` (default) or `meta` in `backend/.env`.

**Twilio (production):** use an approved WhatsApp sender, not the sandbox number.

**Meta Cloud API:** set `META_WHATSAPP_TOKEN` and `META_WHATSAPP_PHONE_NUMBER_ID`.

Leave credentials blank to disable WhatsApp (app works without it).

## Roles

- `owner` — full access including summary, settings, payments, analytics
- `mechanic` — assigned jobs only; no summary/settings

## Pilot program

See [docs/PILOT.md](docs/PILOT.md) for onboarding steps and KPI tracking.

## Production checklist

1. `SECRET_KEY`, `WEB_BASE_URL`, `CORS_ORIGINS` set correctly
2. Production WhatsApp credentials configured
3. `alembic upgrade head` on deploy
4. Run scheduler on a **single worker** (or disable `SCHEDULER_ENABLED` on multi-worker hosts)
5. Optional: R2/S3 for job photos
