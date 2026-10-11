# ⚡ ChargeNOC

ChargeNOC is a platform for evidence-backed EV charging approvals in apartment societies. It helps residents submit charging requests with supporting photos and documentation, while giving RWAs and electricians a clearer, reviewable workflow for approvals, conditions, and final NOC issuance.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Django](https://img.shields.io/badge/Django-5-092E20) ![DRF](https://img.shields.io/badge/DRF-REST-red) ![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E) ![License](https://img.shields.io/badge/License-Proprietary-lightgrey)

---

## Project at a glance

This repository contains the full project stack for the ChargeNOC workflow:

- Frontend: Next.js app with role-based dashboards
- Backend: Django + Django REST Framework API
- Storage and auth: Supabase integration
- AI screening: pluggable photo-check service with mock and real backends
- Final document: Haan Packet / NOC dossier output

The goal is to reduce approval uncertainty and replace opinion-driven gating with evidence, audit history, and clear conditions.

## Why this exists

Apartment societies often face a simple problem: EV owners need permission to install a charger, but decisions are usually slowed by incomplete evidence, unclear rules, and ad hoc review cycles. ChargeNOC is designed to make that process legible and auditable.

The workflow is intentionally structured as:

> Application → Photo evidence → AI screening → Human review → Conditional approval → Final verified NOC

This gives societies a path to approve with conditions, not just a binary yes/no.

## Core features

- EV owner request flow with supporting evidence
- Role-based access for owners, RWAs, electricians, and admins
- Photo upload and review process
- AI preliminary screening via a swappable backend
- Conditional approval flow
- Append-only assessment and activity history
- Haan Packet generation for final NOC documentation

## Repository layout

```text
.
├── backend/         # Django app, API, models, migrations
├── frontend/        # Next.js frontend and dashboards
├── docs/            # Architecture and project analysis notes
├── proj/            # Additional project-specific tooling / evaluation scripts
├── chargesathi/     # Charging / AI-related utilities or service layer
├── imageVerification/
├── README.md
└── .gitignore
```

## Architecture summary

```text
Frontend (Next.js)  <->  Django REST API  <->  Supabase / Postgres / Storage
                              |
                              +--> PhotoCheckService (mock or real)
                              +--> PDF generation for approved packets
```

For deeper system details, see:

- [docs/architecture.md](docs/architecture.md)
- [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md)
- [docs/PARKING_ANALYZER_REPORT.md](docs/PARKING_ANALYZER_REPORT.md)

## Tech stack

- Frontend: Next.js 15, TypeScript, Tailwind CSS
- Backend: Django 5, Django REST Framework
- Auth/data: Supabase
- PDF generation: ReportLab
- AI screening: pluggable service interface (`PHOTO_CHECK_BACKEND`)

## Local development setup

### Prerequisites

- Node.js 18+
- Python 3.12+
- A Supabase project for auth/storage if you are running the full stack locally

### 1) Install dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 2) Configure environment

Copy the sample environment files and fill in your values:

```bash
cp backend/.env.example backend/.env
```

For local frontend config, create the file if your setup requires it:

```bash
cp frontend/.env.example frontend/.env.local
```

### 3) Set up the database

```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
```

If your local branch includes additional demo data scripts, run them explicitly; otherwise, create the needed users and roles within the app or Django admin.

### 4) Run the services

```bash
# Terminal 1: backend
cd backend
python manage.py runserver

# Terminal 2: frontend
cd frontend
npm run dev
```

### Default local URLs

| Service | URL |
|---------|------|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000/api/v1/ |

## Environment variables

The project currently uses a Django env-based setup. The concrete keys in use can be seen in [backend/.env.example](backend/.env.example).

### Backend

Key settings include:

- `SECRET_KEY`
- `DEBUG`
- `PHOTO_CHECK_BACKEND` (`mock` or `real` depending on the configured service)
- `GEMINI_API_KEY`
- `GEMINI_MODELS`
- `GEMINI_TIMEOUT_SECONDS`
- `CHATBOT_MODEL`
- other backend-specific service settings

> Security note: never commit `.env` files to the repo, and keep API keys and service secrets server-side only.

### Frontend

Typical frontend config includes values such as:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL`

## Role model and access

The app is designed around clear ownership boundaries:

| Role | Access |
|------|--------|
| `ev_owner` | Own requests, evidence, conditions, and packet-related actions |
| `rwa_admin` | Society-scoped review and approval workflows |
| `electrician` | Assigned inspections and verification actions |
| `super_admin` | Broad read-only oversight of the platform |

Role enforcement is handled in the backend rather than only in the UI.

## AI integration notes

The AI screening layer is intentionally modular. The backend exposes a `PhotoCheckService` abstraction and toggles the implementation via `PHOTO_CHECK_BACKEND`.

Current behavior is typically mock-based for local testing, while real integrations can be swapped in without changing the surrounding request flow.

Key principles:

1. AI output is meant for preliminary screening, not final electrical certification.
2. Null confidence should never be treated as high confidence.
3. Human review remains required before final approval.
4. Assessments are versioned and append-only instead of overwritten.

See [docs/architecture.md](docs/architecture.md) and [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md) for the operational context.

## Haan Packet (NOC dossier)

The Haan Packet is the final, reviewable output of an approved request. It is intended to contain:

- Request and resident details
- Society approval information
- Inspection sign-off and conditions
- Verification metadata such as hashes or QR-backed authenticity markers

This is designed to create a stronger paper trail than a plain approval note.

## Current project status

This codebase is actively being developed and some parts are still proof-of-concept or intentionally mock-driven. The project is structurally complete enough to run locally, but you should expect configuration and workflow details to evolve as the platform matures.

## Roadmap

### Completed direction

- EV request and evidence workflow
- Role-based access patterns
- Mock AI screening path
- Packet generation/integration work
- Django + Next.js project structure

### Planned work

- Real AI service integration
- More complete RWA decision workflow
- Electrician sign-off steps in the UI
- Scheduling and billing modules
- DISCOM / formal compliance integrations
- Expanded data validation and production hardening

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Django app fails to start | Confirm your virtual environment is active and requirements are installed |
| Frontend cannot reach the API | Verify `NEXT_PUBLIC_API_BASE_URL` and that Django is running on port 8000 |
| CORS issues | Add the frontend origin to the allowed CORS configuration in the backend |
| AI or photo-check calls fail | Check the configured `PHOTO_CHECK_BACKEND` and required keys in the backend env file |
| `pip install` fails | Confirm Python 3.12+ and that the correct environment is active |

## License

Proprietary. All rights reserved.
