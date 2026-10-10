# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │   Auth    │  │   Storage    │  │       Postgres           │   │
│  │(email/pw) │  │(private bkt) │  │  (Django-managed tables) │   │
│  └────┬─────┘  └──────┬───────┘  └────────────┬─────────────┘   │
└───────┼────────────────┼──────────────────────┼─────────────────┘
        │                │                      │
   JWT tokens      Signed URLs           DATABASE_URL
        │                │                      │
┌───────┴────────────────┴──────────────────────┴─────────────────┐
│                     Django Backend                                │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────────┐  │
│  │ JWT verify  │  │  REST API   │  │  PhotoCheckService       │  │
│  │ middleware  │  │ /api/v1/... │  │  (mock ↔ http toggle)    │  │
│  └────────────┘  └─────────────┘  └──────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Django Apps: accounts, societies, requests, evidence,     │  │
│  │  assessments, conditions, scheduling, billing, packets,    │  │
│  │  activity, core                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API
┌──────────────────────────┴──────────────────────────────────────┐
│                    Next.js Frontend                               │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────────┐  │
│  │  Supabase   │  │  API Client │  │   Role-based Routing     │  │
│  │  Auth (SSR) │  │  (typed)    │  │   & Guards               │  │
│  └────────────┘  └─────────────┘  └──────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Dashboards: Owner, RWA Admin, Electrician, Super Admin    │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### Authentication Flow
1. User signs up / logs in via Supabase Auth (frontend)
2. Supabase returns a JWT access token
3. Frontend sends the token in `Authorization: Bearer <token>` on every API call
4. Django middleware verifies the JWT using the Supabase JWT secret (HS256)
5. Django maps the Supabase `user.id` to a `Profile` containing `role` and `society`

### Role Ownership
- Roles are stored in Django's `Profile` model, never in Supabase user metadata
- Only `ev_owner` can self-register; other roles are provisioned via Django admin
- The client cannot set or modify its own role

### File Uploads
- Files upload directly to Supabase Storage from the browser
- Django validates file metadata and generates signed URLs for access
- EXIF location data is stripped server-side before any processing

### AI Photo Check
- Abstract `PhotoCheckService` protocol in `assessments/services.py`
- `MockPhotoCheckService` returns deterministic demo data
- `HttpPhotoCheckService` (stub) for future real service
- Toggled via `PHOTO_CHECK_BACKEND` env var

### State Machines
- `ChargingRequest` and `Condition` have explicit state machines
- Transitions are tested and enforced at the model level
- Invalid transitions raise `InvalidStateTransition`

### Append-Only Records
- `ActivityEvent`, `ConditionEvent`, and `ReviewDecision` are insert-only
- No update or delete operations exposed via API or model methods
- Corrections are recorded as new events
