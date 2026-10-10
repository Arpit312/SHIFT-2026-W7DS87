# Parking Analyzer — Analysis

> Step 1 of the parking-analyzer integration. Read-only inspection of `proj/` and
> the existing `backend/assessments/services/chargenoc_ai/`.
> Performed on branch `parking-analyzer`, 2026-10-11.

---

## 1. What it is and what it does

`proj/` is the **ChargeNOC AI Model Starter**, a standalone Python prototype.
It analyses one or more photos of a proposed EV-charger installation area for
**visible risks only**. It is explicit that it cannot prove hidden wiring,
earthing, circuit capacity, breaker ratings, code compliance, or overall safety.

It returns one of four screening statuses:

| Status | Meaning |
|---|---|
| `CONTINUE_TO_ELECTRICIAN` | No visible rejection-level issue found in this photo |
| `MANUAL_REVIEW` | Uncertain — cannot tell from photo alone |
| `CORRECTION_REQUIRED` | A material visible hazard was found |
| `RETAKE_PHOTO` | Photo is unusable (blurry, dark, obstructed, irrelevant) |

It is **not** a safety certification, approval, or electrical design tool.

---

## 2. Entry points

| Script / callable | What it does |
|---|---|
| `run_screening.py` | CLI: screen one photo or a folder of photos |
| `run_eval.py` | Evaluator: batch-run against labelled eval sets |
| `start.py` / `start.bat` / `start.sh` | One-click setup + test + eval |
| `chargenoc_ai.vision_screening.screen_area(image_path)` | Screen one image file |
| `chargenoc_ai.vision_screening.screen_group(image_paths)` | Screen several photos of one site |
| `chargenoc_ai.hardware_rules.recommend_hardware(screening)` | Derive a preliminary hardware checklist from screening result |

---

## 3. Dependencies, versions and conflicts

| Package | Required version | Installed in backend venv | Conflict? |
|---|---|---|---|
| `google-genai` | `>=1.0.0` | `2.29.0` ✓ | None |
| `python-dotenv` | `>=1.0.0` | present ✓ | None |
| `pytest` | `>=8.0.0` | `>=8.3` ✓ | None |

No GPU, no torch, no heavy ML dependency. All computation is done by the
Gemini cloud API. The backend `.venv` already has `google-genai==2.29.0`
installed but it is **missing from `backend/requirements.txt`** — this is a
pre-existing gap that must be fixed in this integration.

**RAM / CPU:** negligible (HTTP request + JSON parse). Startup time: none
(stateless function call). Latency: 2–8 s typical for Gemini vision models,
bounded by `GEMINI_TIMEOUT_SECONDS` (new env var, see §11).

---

## 4. Model / provider and data egress

- **Provider:** Google Gemini via `google-genai` SDK (cloud API).
- **What leaves the system:** the raw parking-location photo bytes only.
  No other photos, no owner name, no address, no PII.
- **EXIF stripping:** the integration will strip EXIF metadata before sending
  (using Pillow, which is already in `backend/requirements.txt`).
- **Consent wording:** `TODO(team)` — must be added to the UI before production.
- **API key:** reuses `GEMINI_API_KEY` from `backend/.env` (gitignored).
  The key in `proj/.env` is **not** read, printed, or copied.

---

## 5. Criteria — verbatim from the prompt and schema

### 5a. Prompt — critical visual inspection points (proj version, verbatim)

```
Critical visual inspection points:
- Scrutinize the mounting wall, pillars, beams, ceiling, and overhead pipe runs
  for water seepage streaks, moisture trails, rust/brown water marks, damp
  patches, efflorescence, wall cracks, or plumbing leaks above or on the wall.
- Water seepage streaks, moisture trails, damp wall staining, or wall cracks
  where electrical equipment or chargers would be mounted are material hazards
  (type: water_or_dampness). Grade severity as medium or high.
```

### 5b. Prompt — decision rules (proj version, verbatim)

```
Decision rules:
- RETAKE_PHOTO: image is blurry, too dark, obstructed, or not an installation
  area (selfie, screenshot, unrelated object). Set image_quality accordingly.
- CORRECTION_REQUIRED: a reasonably apparent, material visible hazard (e.g.
  water seepage / moisture streak / dampness / cracks on the wall or floor,
  plumbing leak risk, bare/damaged/taped-over wires, stored combustibles, cable
  route across a walkway, no working clearance). Give severity medium or high.
- MANUAL_REVIEW: you cannot tell (partial view, glare, ambiguous object, or
  suspicious wall stains needing on-site specialist check). Add a hazard of type
  uncertain explaining why.
- CONTINUE_TO_ELECTRICIAN: usable image, wall and floor are sound, clean, and
  completely dry with no visible hazards. Use hazards [{type none_visible}] only
  in this case.
Never say safe, risk-free, certified, or approved. A photo cannot prove hidden
electrical conditions. Include none_visible only if no listed hazard is visible.
Output JSON only.
```

### 5c. Hazard types — verbatim from `schemas.py`

```python
HAZARD_TYPES = {
    "water_or_dampness",
    "exposed_or_damaged_wiring",
    "combustibles_or_fire_hazard",
    "pedestrian_or_cable_obstruction",
    "cramped_or_inaccessible",
    "visible_electrical_hazard",
    "none_visible",
    "uncertain",
}
```

Eight strings. Six are real hazard types. Two are sentinels:
- `none_visible` — "nothing found"; used only with `CONTINUE_TO_ELECTRICIAN`
- `uncertain` — "cannot tell"; triggers `MANUAL_REVIEW`

### 5d. Image quality values — verbatim from `schemas.py`

```python
IMAGE_QUALITIES = {"usable", "blurry", "dark", "obstructed", "irrelevant", "uncertain"}
BAD_QUALITIES = {"blurry", "dark", "obstructed", "irrelevant"}
```

### 5e. Severity values — verbatim from `schemas.py`

```python
SEVERITIES = {"low", "medium", "high", "unknown"}
```

### 5f. Minimum confidence threshold — verbatim from `schemas.py`

```python
MIN_CONFIDENCE = 0.5  # real hazard below this -> human decides
```

---

## 6. Input and output format

### Input

- One image file: JPG, JPEG, PNG, or WEBP.
- Max size: 15 MB.
- No minimum resolution specified.
- Image is read as raw bytes and sent directly to Gemini (no resize in the
  current code). The integration will resize/normalise to ≤ 1920 px on the
  longest edge before sending to reduce latency and cost.

### Output — single image (`validate_result` return value)

```jsonc
{
  "screening_status": "CONTINUE_TO_ELECTRICIAN | MANUAL_REVIEW | CORRECTION_REQUIRED | RETAKE_PHOTO",
  "image_quality": "usable | blurry | dark | obstructed | irrelevant | uncertain",
  "hazards": [
    {
      "type": "<see HAZARD_TYPES>",
      "severity": "low | medium | high | unknown",
      "confidence": 0.0..1.0,    // float, not bool
      "evidence": "string"
    }
  ],
  "summary": "string",
  "limitations": ["string"],
  "requires_electrician": true   // always set to true by validate_result
}
```

### Output — group (`aggregate_group` return value)

```jsonc
{
  "group_status": "CONTINUE_TO_ELECTRICIAN | MANUAL_REVIEW | CORRECTION_REQUIRED | RETAKE_PHOTO",
  "image_count": 3,
  "image_statuses": ["..."],
  "hazards": [
    { "...": "...", "image_index": 0 }
  ],
  "limitations": ["string"],
  "requires_electrician": true
}
```

### Bounding boxes

The current prompt does **not** ask the model to return bounding boxes.
No box data is present in any output field. The spec requirement for
normalised-coordinate boxes is therefore a `TODO(team)` — it would require a
prompt change and a new field in the schema, and its mapping to `EvidenceRegion`
in the contract is noted in the gap table below.

### Image-size handling

The current code sends the raw bytes unchanged. Images over 15 MB are rejected
client-side before they reach the API.

---

## 7. Diff summary: `backend/assessments/services/chargenoc_ai/` vs `proj/chargenoc_ai/`

`hardware_rules.py` and `schemas.py` are **byte-for-byte identical**.

`vision_screening.py` has three functional differences in the proj version:

| # | Area | Backend version | proj version |
|---|---|---|---|
| 1 | **Prompt** | Does not mention water seepage, efflorescence, wall cracks explicitly | Adds a "Critical visual inspection points" block that names: water seepage streaks, moisture trails, rust/brown water marks, damp patches, efflorescence, wall cracks, plumbing leaks above the wall. Grades these as `water_or_dampness` medium/high. |
| 2 | **Model fallback** | Uses single `GEMINI_MODEL` from env. No fallback. Fails immediately if the model name is wrong. | Maintains a hardcoded `MODELS` list of 5 names. If `GEMINI_MODEL` is set it goes first, then the list. Tries models in order; moves to next on 404/unsupported/quota errors. |
| 3 | **Error handling** | Two retries only on malformed JSON. Exceptions are not caught per-model. | Catches `ServerError` (503), `ClientError`, `APIError`, and generic `Exception` per model per attempt. Retries once on 503 before moving to the next model. |

**Decision (per your instruction 5a):** no second analyzer pass. The proj
version is an in-place upgrade of the backend version with better water-hazard
detection, model fallback, and error handling. The upgrade will be applied to
`backend/assessments/services/chargenoc_ai/vision_screening.py` directly.

The `parking_location` photo is already submitted with every request
(`EVIDENCE_CATEGORIES.PARKING_LOCATION` in the wizard). The integration ensures
it is included in the screened group alongside the other photos.

---

## 8. Security review

| Finding | Location | Severity | Action |
|---|---|---|---|
| Hardcoded absolute path | None found | — | OK |
| Hardcoded keys | `proj/.env` contains a real key | HIGH | Not read, not copied, not printed. `proj/` is untracked and gitignored. |
| `pickle` / `eval` | None found | — | OK |
| Arbitrary file writes | None | — | OK |
| Unvalidated paths | `_load_image` checks extension and size but not path traversal | LOW | Callers inside Django pass only DB-resolved temp file paths — acceptable. |
| Logging of PII | No logging in the module | — | OK |
| `time.sleep(1)` on 503 | `vision_screening.py` proj | LOW | Blocks Django thread. Will be bounded by overall timeout. |

---

## 9. Existing tests and evaluation data

| Item | Location | State |
|---|---|---|
| Unit tests | `proj/tests/test_core.py` | 22 tests, cover schema validation, aggregation, hardware rules, mock API calls, JSON parsing |
| Eval sets | `proj/data/eval_sets/` | 15 sets × 3 slots each, with SHOTLIST.txt and manifest.json. **No real photos present.** All `.gitkeep` placeholders. |
| Labels | `proj/data/labels_template.csv` | Scenario-designed labels, not expert-reviewed. Reviewer is `scenario_design`. |
| Backend tests | `.gitignore` blocks `test_*.py` | Intentionally not tracked |

**No real photos supplied** — evaluation script cannot run against real images.
The eval script will be written but its output will be NOT VERIFIED until photos
are supplied.

---

## 10. Licences

| Component | Licence |
|---|---|
| `google-genai` SDK | Apache 2.0 |
| `python-dotenv` | BSD-3-Clause |
| `Pillow` | HPND (open source) |
| AI model weights | None bundled — cloud inference only |
| Eval labels | Scenario-designed by this project — no third-party data |

No third-party model weights, datasets, or images are bundled. No licence
concern for the integration itself.

---

## 11. Gap table — proj output vs Assessment contract

| Contract field | AI output field | Status | Notes |
|---|---|---|---|
| `overall_verdict` (Verdict enum) | `group_status` | **Derivable** | Mapping table in §12 |
| `confidence` | Not provided globally | **Missing** → `null` | Per-hazard `confidence` exists but no aggregate score |
| `findings[].finding_id` | Not provided | **Missing** → generated | UUID generated at adapter time |
| `findings[].title` | `hazards[].type` | **Derivable** | Human-readable title from type |
| `findings[].severity` (Severity enum) | `hazards[].severity` | **Derivable** | Mapping table in §12 |
| `findings[].explanation` | `hazards[].evidence` | **Provided** | Direct |
| `findings[].confidence` | `hazards[].confidence` | **Provided** | Direct (float 0–1) |
| `findings[].source_photo_id` | `hazards[].image_index` | **Derivable** | Map index → Evidence ID |
| `findings[].evidence_region` | Not provided (no boxes in prompt) | **Missing** → `null` | TODO(team): requires prompt change |
| `findings[].recommended_action` | Not provided | **Missing** → derived from type | Static lookup table by hazard type |
| `findings[].requires_electrician` | `requires_electrician: true` | **Provided** | Always true |
| `findings[].status` | Not tracked by AI | **Missing** → `"unresolved"` | Default |
| `missing_information` | `uncertain` hazard evidence strings | **Derivable** | Uncertain hazards → missing_information |
| `suggested_conditions` | `hardware_rules.recommend_hardware()` | **Derivable** | Already mapped in existing service |
| `requires_human_review` | derived from `group_status` | **Derivable** | MANUAL_REVIEW or RETAKE_PHOTO → true |
| `limitations` | `group.limitations` | **Provided** | Direct |
| `is_demo` | Not a model concept | **Derivable** | `False` when real model called |
| `service_name` | Not a model concept | **Derivable** | `"google-genai-vision"` |
| `model_version` | Whichever model answered | **Provided** | Stored from `current_model` |

---

## 12. Contract mapping table (your specification, §5e)

### Verdict mapping

| AI `group_status` | Contract `overall_verdict` | Condition |
|---|---|---|
| `CONTINUE_TO_ELECTRICIAN` | `yes` | Only when guard passes (no unresolved critical, no null confidence on critical, no missing required photo, `requires_human_review` false) |
| `CORRECTION_REQUIRED` | `electrician_first` | When `requires_electrician` is true (always) |
| `CORRECTION_REQUIRED` | `yes_with_conditions` | When `requires_electrician` is false (unreachable in practice — kept for completeness) |
| `MANUAL_REVIEW` | `needs_review` | Always |
| `RETAKE_PHOTO` | `needs_review` | Always; `missing_information` gets a retake message per unusable photo |

### Severity mapping

| AI `severity` | Contract `Severity` |
|---|---|
| `high` | `critical` |
| `medium` | `major` |
| `low` | `minor` |
| `unknown` | → `needs_review` verdict; finding not shown to owner; goes to `missing_information` |

### Sentinel handling

| AI sentinel | Action |
|---|---|
| `none_visible` | No finding created. Not shown to owner. |
| `uncertain` | Finding NOT created. Evidence string → `missing_information`. Verdict forced to `needs_review`. |

### Request status after verdict

| Contract verdict | Request status |
|---|---|
| `yes` | `awaiting_verification` (electrician sign-off required before RWA sees it) |
| `yes_with_conditions` | `awaiting_verification` |
| `electrician_first` | `corrective_action_required` |
| `needs_review` | `review_required` |

**`awaiting_rwa_decision` is never set directly from the photo check result.**
Electrician sign-off comes first.

---

## 13. Overlap with existing Photo Check AI

The existing `chargenoc_ai` in the backend is an **older copy** of the same
code, with these differences from the proj version:

- Missing water-seepage-specific prompt language
- No model fallback list
- No per-model error handling (ServerError, ClientError, APIError)

After the upgrade there is one pipeline, one Gemini call, one result.
No duplicate calls, no conflicting verdicts.

---

## 14. Pre-existing issues found (not caused by this integration)

| Issue | Location | Severity |
|---|---|---|
| `google-genai` missing from `backend/requirements.txt` | `backend/requirements.txt` | Medium — fixed in this integration |
| `DemoDataBanner` component accepts no props but photo-check page passes `message=` prop | `frontend/src/components/ui/demo-data-banner.tsx` | Minor — fixed in this integration |
| `StatusBadge` requires `type` prop but conditions page calls it without `type` | `frontend/src/app/dashboard/owner/conditions/page.tsx` | Minor — fixed in this integration |
| Assessment `overall_verdict` stored as `pass`/`fail`/`needs_review` in DB but frontend `Verdict` type uses `yes`/`yes_with_conditions`/`electrician_first`/`needs_review` | `backend/assessments/services/__init__.py`, `frontend/src/lib/constants.ts` | High — fixed in this integration |
| Request status set to `awaiting_rwa_decision` directly after photo check (skips electrician) | `backend/charging_requests/views.py` | High — fixed in this integration |
| `check_env` referenced in `docs/LOCAL_SETUP.md` but does not exist | `docs/LOCAL_SETUP.md` | Low — updated in this integration |

---

## 15. New environment variables

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_MODELS` | (see below) | Comma-separated ordered list of model names to try. First valid name wins. |
| `GEMINI_TIMEOUT_SECONDS` | `30` | Total wall-clock timeout for one screening call (all models, all retries) |
| `GEMINI_MAX_RETRIES_PER_MODEL` | `2` | Max JSON-parse retries per model before moving to the next |
| `PHOTO_CHECK_BACKEND` | `mock` | `mock` or `real` |

Default for `GEMINI_MODELS` (written to `.env.example`):
```
GEMINI_MODELS=gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash
```
These are the currently valid model names as of 2026-10 per Google documentation.
TODO(team): verify the exact model names available to your account and update this list.
The `model_version` field in Assessment will store the name of the model that
actually responded.
