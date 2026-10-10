# Parking Analyzer Integration Report

Branch: `parking-analyzer` from `chatbot-integration`
Date: 2026-10-11

---

## Progress table

| Step | What I ran | Real output | Result |
|---|---|---|---|
| Branch creation | `git checkout -b parking-analyzer` | `Switched to a new branch 'parking-analyzer'` | ✓ |
| Diff backend vs proj | PowerShell line-by-line compare | 0 differences in hardware_rules.py and schemas.py; vision_screening.py differs in 3 areas (see below) | ✓ |
| Django system check | `manage.py check` | `System check identified no issues (0 silenced)` | ✓ |
| Migrations check | `manage.py showmigrations assessments` | `0001_initial [X]`, `0002_… [X]` — no new migration needed | ✓ |
| `google-genai` in backend venv | `pip show google-genai` | `Version: 2.29.0` | ✓ |
| Backend tests (before changes) | `pytest -v` | 10 passed | ✓ |
| Backend tests (after changes) | `pytest -v` | 10 passed | ✓ |
| TypeScript check | `npx tsc --noEmit` | Exit 0, no output | ✓ |
| Next.js build | `npx next build` | Compiled successfully, exit 0 | ✓ |
| Real photo evaluation | NOT VERIFIED | No photos supplied — eval_sets/ contain only `.gitkeep` files | NOT VERIFIED |
| E2E browser test | NOT VERIFIED | Playwright not configured; backend needs Supabase to serve real photos | NOT VERIFIED |

---

## Files changed

### New files

| File | Purpose |
|---|---|
| `backend/assessments/services/chargenoc_ai/adapter.py` | Single dedicated mapping module: AI output → Assessment contract |
| `docs/PARKING_ANALYZER_ANALYSIS.md` | Step 1 analysis document |
| `docs/PARKING_ANALYZER_REPORT.md` | This file |

### Modified files

| File | What changed |
|---|---|
| `.gitignore` | Added exceptions for the two new docs |
| `backend/requirements.txt` | Added `google-genai>=1.0.0,<3` (was missing) |
| `backend/.env.example` | Added `GEMINI_MODELS`, `GEMINI_TIMEOUT_SECONDS`, `GEMINI_MAX_RETRIES_PER_MODEL` |
| `backend/chargenoc/settings.py` | Read three new Gemini env vars |
| `backend/assessments/services/chargenoc_ai/vision_screening.py` | Upgraded in place from proj version: water-seepage prompt, model fallback, error handling, `model_version` in result |
| `backend/assessments/services/__init__.py` | Rewritten: structured Mock/Real service, EXIF stripping, uses adapter |
| `backend/assessments/serializers.py` | Added `AssessmentSerializer` (was empty) |
| `backend/assessments/views.py` | Added `AssessmentViewSet` (was empty) |
| `backend/assessments/urls.py` | Registered `AssessmentViewSet` |
| `backend/chargenoc/urls.py` | Added nested `/requests/<pk>/assessments/` route |
| `backend/charging_requests/views.py` | Fixed request-status mapping, fixed `awaiting_rwa_decision` skip |
| `frontend/src/lib/constants.ts` | Updated parking photo guidance, added `AssessmentTaskStatus` |
| `frontend/src/types/index.ts` | Updated `Assessment` type to match real API fields |
| `frontend/src/components/ui/demo-data-banner.tsx` | Fixed: accepts optional `message` and `show` props |
| `frontend/src/components/ui/timeline.tsx` | Fixed: `TimelineItem` interface extended with `date`, `status` fields |
| `frontend/src/app/dashboard/owner/photo-check/page.tsx` | Full rewrite: pending/running/failed states, per-finding cards with severity/confidence/source, limitations, retry button, no demo banner on real results |
| `frontend/src/app/dashboard/owner/conditions/page.tsx` | Fixed pre-existing: `StatusBadge` `type` prop, `FileDropzone` props, `submitConditionProof` args |
| `frontend/src/app/dashboard/owner/evidence/page.tsx` | Fixed pre-existing: `condition_addressed` → `condition_addressed_id` |
| `frontend/src/app/dashboard/owner/bills/page.tsx` | Fixed pre-existing: `"outline"` → `"secondary"` variant |
| `frontend/src/app/dashboard/owner/packet/page.tsx` | Fixed pre-existing: `"outline"` → anchor, `file_url` → `download_url` |
| `frontend/src/app/dashboard/owner/tracker/page.tsx` | Fixed pre-existing: `RequestStatus` order, `TimelineItem` field names |

---

## Diff summary: backend chargenoc_ai vs proj chargenoc_ai

`hardware_rules.py` and `schemas.py` are **byte-for-byte identical**.

`vision_screening.py` — three functional differences (proj is the upgraded version):

| # | Area | Backend (old) | proj (upgraded to backend) |
|---|---|---|---|
| 1 | **Prompt** | No explicit water-seepage language | Adds "Critical visual inspection points": seepage streaks, moisture trails, rust/brown marks, damp patches, efflorescence, wall cracks, plumbing leaks. Grades these `water_or_dampness` medium/high. |
| 2 | **Model fallback** | Single `GEMINI_MODEL` from env. Fails immediately if wrong. | Reads comma-separated `GEMINI_MODELS` from env; builds fallback list. Tries each model in order; moves to next on 404/quota errors. |
| 3 | **Error handling** | 2 retries on malformed JSON only. No per-model exception handling. | Catches `ServerError` (503), `ClientError`, `APIError`, generic `Exception` per model per attempt. Retries once on 503 before moving on. |

**Decision**: No second analyzer pass. One pipeline, one Gemini call. The proj
improvements were applied in-place to the backend module.

---

## Adapter mapping

### Verdict mapping table

| AI `group_status` | Contract `overall_verdict` | Guard conditions |
|---|---|---|
| `CONTINUE_TO_ELECTRICIAN` | `yes` | Only when: no unresolved critical finding, no null confidence on critical/major finding, `requires_human_review` false, no uncertain hazards |
| `CORRECTION_REQUIRED` | `electrician_first` | `requires_electrician` always true |
| `MANUAL_REVIEW` | `needs_review` | Always |
| `RETAKE_PHOTO` | `needs_review` | Always; adds retake message to `missing_information` |

### Severity mapping table

| AI `severity` | Contract `Severity` |
|---|---|
| `high` | `critical` |
| `medium` | `major` |
| `low` | `minor` |
| `unknown` | Not shown to owner; evidence → `missing_information`; verdict → `needs_review` |

### Sentinel handling

| AI sentinel | Action |
|---|---|
| `none_visible` | No finding created. Not shown to owner. |
| `uncertain` | Evidence string → `missing_information`. Verdict forced to `needs_review`. |

### Request status after verdict

| Contract verdict | Request status | Note |
|---|---|---|
| `yes` | `awaiting_verification` | Electrician sign-off before RWA |
| `yes_with_conditions` | `awaiting_verification` | Same |
| `electrician_first` | `corrective_action_required` | |
| `needs_review` | `review_required` | |

`awaiting_rwa_decision` is never set from the photo check result.

---

## Merge rules (one pipeline)

Not applicable — there is one analyzer and one Gemini call per assessment. The
merge-rule question is pre-empted by design (instruction 5a).

If a future second analyzer is added, the merge rules specified in Step 3 of
the brief should be implemented in the adapter module.

---

## Criteria used (verbatim from prompt and schema)

See `docs/PARKING_ANALYZER_ANALYSIS.md` §5 for full verbatim quotation.

Hazard types (verbatim from `schemas.py`):
```
water_or_dampness, exposed_or_damaged_wiring, combustibles_or_fire_hazard,
pedestrian_or_cable_obstruction, cramped_or_inaccessible, visible_electrical_hazard,
none_visible (sentinel), uncertain (sentinel)
```

---

## Assumptions

1. `GEMINI_API_KEY` in `backend/.env` has access to at least one of the models
   in `GEMINI_MODELS`. NOT VERIFIED — no real API call was made during this
   integration (mock backend used for tests).

2. Supabase storage is configured and `SUPABASE_URL` + `SUPABASE_STORAGE_BUCKET`
   are set before the real photo-check flow is used. Without these, `RealPhotoCheckService`
   will skip all evidence entries.

3. The `parking_location` photo is submitted in every request (enforced by the
   wizard validation on step 2). The screener runs on all submitted evidence for
   a request, which includes the parking photo.

4. Bounding boxes: the current prompt does not request them. `evidence_region`
   is always `null`. TODO(team) — prompt change required.

5. Consent wording for photos leaving the system (going to Google Gemini):
   TODO(team).

6. Model names in `GEMINI_MODELS` default: `gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash`.
   TODO(team): verify these are available to your account.

---

## What was not verified

| Item | Reason |
|---|---|
| Real Gemini API call | No real photos supplied; mock backend used |
| Evaluation (eval script) | No photos in `proj/data/eval_sets/` |
| E2E browser test | Playwright not configured; no Supabase photo URLs available |
| Model name validity | Cannot verify without a live Gemini API call |
| EXIF stripping correctness | Unit test not run against real image with EXIF |

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Gemini model name changes | Medium | `GEMINI_MODELS` env var; fallback list; `model_version` stored per assessment |
| Photos leave system to Google without consent UI | High (before TODO is done) | Must add consent wording before production |
| `SUPABASE_URL` not set → evidence skipped silently | Medium | Warning logged; assessment will succeed with 0 images and verdict `needs_review` due to empty evidence list |
| Django thread blocked on `time.sleep(1)` retry | Low | Bounded by `GEMINI_TIMEOUT_SECONDS` (default 30 s) |
| Pre-existing TS errors in pages I did not touch | Resolved | All 8 pre-existing TS/lint errors in the EV owner flow fixed in this branch |

---

## How to test in Chrome

### Prerequisites
1. `backend/.env` has `GEMINI_API_KEY` (real key), `GEMINI_MODELS`, `PHOTO_CHECK_BACKEND=real`
2. `SUPABASE_URL` and `SUPABASE_STORAGE_BUCKET` are set in `backend/.env`
3. Frontend `NEXT_PUBLIC_SUPABASE_*` variables are set in `frontend/.env.local`
4. `python manage.py runserver` running on port 8000
5. `npm run dev` running on port 3000

### Test 1 — Happy path
1. Open `http://localhost:3000/dashboard/owner`
2. Click **New Charging Request**
3. Step 1: fill in vehicle details
4. Step 2: upload three photos — charger label, a clean parking spot, nearest socket
5. Step 3: fill in questionnaire; step 4: review; click **Submit Request**
6. Navigate to `/dashboard/owner/photo-check`
7. **Expected**: status badge shows "Analysing…" (pending/running), auto-refreshes every 5 s
8. **Expected after ~30 s**: report shows one of: Yes / Electrician First / Needs Review
9. **Expected**: `is_demo` badge NOT shown; analyser label shown in Report Details
10. **Expected**: no `console.error` in browser DevTools

### Test 2 — Bad parking photo
1. Repeat steps 1–5 with a blurry or dark parking photo
2. **Expected**: verdict is `needs_review`; missing_information lists a retake message
3. **Expected**: `requires_human_review` badge shown

### Test 3 — Hazard photo
1. Repeat with a parking photo showing damp/wet wall
2. **Expected**: verdict is `electrician_first`; finding with severity `critical` or `major`
3. **Expected**: finding shows recommended action

### Test 4 — Analyzer stopped (mock backend)
1. Set `PHOTO_CHECK_BACKEND=mock` and restart Django
2. Submit a request
3. **Expected**: report shows `is_demo` banner; findings are mock data
4. **Expected**: no crash

### Test 5 — Second owner blocked
1. Log in as a different EV owner
2. Try `GET /api/v1/requests/<first-owner-request-id>/assessments/`
3. **Expected**: HTTP 404 (empty queryset)

### Failure indicators
- Report page stays blank → assessment `status` stuck at `pending`: check Django logs
- `is_demo` banner appears on real results → `PHOTO_CHECK_BACKEND` still set to `mock`
- Verdict `yes` for a photo with a visible hazard → guard rule not firing; check `guard_adjustments` in the DB
- `console.error: Unhandled runtime error` → check for the Next.js layout `{children}` issue

---

## LOCAL_SETUP additions

Add to `backend/.env` for the parking analyzer:

```
PHOTO_CHECK_BACKEND=real
GEMINI_MODELS=gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash
GEMINI_API_KEY=<your-key>
GEMINI_TIMEOUT_SECONDS=30
GEMINI_MAX_RETRIES_PER_MODEL=2
```

For mock/development mode (no Gemini calls):
```
PHOTO_CHECK_BACKEND=mock
```
