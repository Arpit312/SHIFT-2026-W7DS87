# ChargeNOC

A hardware-free platform that helps residents of Indian apartment societies request EV charging permission, and helps their Resident Welfare Association (RWA) decide using documented evidence.

## Architecture

**Monorepo** with three top-level directories:

| Directory | Stack | Purpose |
|-----------|-------|---------|
| `frontend/` | Next.js 15, TypeScript, Tailwind CSS | App Router SPA with role-based dashboards |
| `backend/` | Django 5, Django REST Framework | API server, business logic, PDF generation |
| `docs/` | Markdown | Architecture notes, API contracts, decision records |

### Key Integrations

- **Database & Auth**: Supabase (Postgres + Auth + Storage)
- **AI Photo Check**: Mock service in Phase 1; clean interface for real service integration
- **PDF Generation**: ReportLab (pure Python, no system dependencies)

## Prerequisites

- **Node.js** >= 18
- **Python** 3.12+
- **Supabase** project (free tier is sufficient for development)

## Setup

### 1. Clone and install

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment variables

Copy the example files and fill in your values:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

See each `.env.example` for required variables.

### 3. Database setup

```bash
cd backend
python manage.py migrate
python manage.py seed_demo  # Creates demo society, users, and sample data
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend
python manage.py runserver

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1/

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL (default: `http://localhost:8000`) |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DJANGO_SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | `True` for development |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts |
| `DATABASE_URL` | Supabase Postgres connection string |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret for token verification |
| `SUPABASE_STORAGE_BUCKET` | Private storage bucket name |
| `PHOTO_CHECK_BACKEND` | `mock` or `http` |
| `DEMO_OWNER_PASSWORD` | Password for demo owner account |
| `DEMO_RWA_PASSWORD` | Password for demo RWA admin account |
| `DEMO_ELECTRICIAN_PASSWORD` | Password for demo electrician account |
| `DEMO_ADMIN_PASSWORD` | Password for demo super admin account |

## Demo Accounts

After running `seed_demo`, the following accounts are available:

| Role | Email |
|------|-------|
| EV Owner | owner@chargenoc.demo |
| RWA Admin | rwa@chargenoc.demo |
| Electrician | electrician@chargenoc.demo |
| Super Admin | admin@chargenoc.demo |

Passwords are set from environment variables. **Never commit passwords.**

## Roles

| Role | Access |
|------|--------|
| `ev_owner` | Own requests, evidence, conditions, slots, bills, packets |
| `rwa_admin` | Society-scoped requests and decisions |
| `electrician` | Assigned inspections |
| `super_admin` | Read-only overview of all data (Phase 1) |

## AI Integration Guide

The AI Photo Check service is built by a separate teammate. Phase 1 ships with a `MockPhotoCheckService` that returns deterministic demo assessments.

### Integration Point

- **Backend**: `assessments/services.py` defines a `PhotoCheckService` protocol with an `assess(request_id)` method
- **Implementation selection**: Set `PHOTO_CHECK_BACKEND=mock` or `PHOTO_CHECK_BACKEND=http`
- **Contract**: See `docs/api-contract.md` for the full `Assessment` type definition

### Key Rules

- AI output is preliminary screening, not electrical certification
- Null confidence is never treated as high confidence
- The UI never auto-approves based on AI confidence
- Every assessment is stored as a new version (append-only)

## Phase 1 Scope

- ✅ Landing page with Three.js hero
- ✅ Authentication (email/password via Supabase)
- ✅ Role-based routing and guards
- ✅ Full EV Owner dashboard
- ✅ RWA Admin inbox (read-only)
- ✅ Electrician inspections list (read-only)
- ✅ Super Admin overview (read-only)
- ✅ Mock AI Photo Check service
- ✅ Haan Packet PDF generation
- ⬜ Real AI service, scheduling, billing, payments (future phases)

## License

Proprietary. All rights reserved.
