# ChargeNOC AI — SHIFT-2026-W7DS87

AI prototypes for EV-charger installation support, built on Google Gemini:

| Folder | What it is | Stack |
|---|---|---|
| [`IMAGE-BASED DECISION/`](IMAGE-BASED%20DECISION) | **ChargeNOC AI** — screens photos of a proposed charger site for visible hazards and returns a decision plus a preliminary hardware checklist | Python, Flask, Gemini vision |
| [`CHATBOT/`](CHATBOT) | **ChargeSathi** — EV-charging help chatbot for Indian EV owners | Node.js, Gemini |
| `AI WORKING DOC.pdf` | Design notes for both components (how the vision model and rules layer split the work; chatbot prompt design) | — |

> Both tools give **general guidance only**. Neither is a safety certification, and a licensed electrician must verify everything before installation.

---

## 1. Image-based decision (ChargeNOC AI)

### How it works

The decision is made in two layers:

| Layer | Role | Nature |
|---|---|---|
| Gemini (vision-language model) | Looks at the photo and reports what is visibly there | Probabilistic |
| Python rules layer (`schemas.py`) | Turns that report into a verdict | Deterministic |

Gemini is told to report only visible evidence, never to guess at hidden wiring, earthing, circuit capacity or breaker ratings, to pick hazards from a fixed list, and to return JSON only.

**Hazard types:** `water_or_dampness`, `exposed_or_damaged_wiring`, `combustibles_or_fire_hazard`, `pedestrian_or_cable_obstruction`, `cramped_or_inaccessible`, `visible_electrical_hazard`, `none_visible`, `uncertain`.

**Statuses:**

| Status | Meaning |
|---|---|
| `CONTINUE_TO_ELECTRICIAN` | No rejection-level visible issue found. Not a safety certification. |
| `CORRECTION_REQUIRED` | A material visible hazard (water, exposed wiring, combustibles, blocked route, no clearance) must be fixed first. |
| `RETAKE_PHOTO` | Photo is blurry, dark, obstructed or not an installation area. |
| `MANUAL_REVIEW` | The model is unsure, confidence is low, or its output is contradictory. A human decides. |

**Rules enforced in code** (the model's own status is not trusted blindly):
1. Unusable image quality → `RETAKE_PHOTO`.
2. A medium/high hazard with confidence ≥ 0.5 → `CORRECTION_REQUIRED`, even if the model said continue.
3. Uncertain quality or hazard, unknown severity, low confidence, or "none visible" alongside a hazard → `MANUAL_REVIEW`.
4. Only a clean result is allowed to stay `CONTINUE_TO_ELECTRICIAN`.

**Site (group) decision.** A site is several photos combined into one result, with this priority: any visible hazard → `CORRECTION_REQUIRED`; else any unusable photo → `RETAKE_PHOTO`; else any uncertainty → `MANUAL_REVIEW`; `CONTINUE_TO_ELECTRICIAN` only if **every** photo is clean.

**Hardware checklist** (`hardware_rules.py`). Category-level suggestions only, with no ratings and no BOM: connector/socket, cable and conduit, circuit breaker, residual-current protection, enclosure/glands/mounting, and earthing/bonding check. Extra items are added for the hazards found and for DC chargers. Every item is marked `AI_SUGGESTED` and requires electrician verification. If the site status isn't `CONTINUE_TO_ELECTRICIAN`, the checklist is flagged as blocked from installation progress.

### Project layout

```
IMAGE-BASED DECISION/
├── app.py                  # Flask web UI (upload photos, see decision)
├── run_screening.py        # CLI: screen a photo or a folder
├── run_eval.py             # Run the 15 evaluation sets
├── start.py / start.sh / start.bat   # one-click setup + run
├── chargenoc_ai/
│   ├── vision_screening.py # Gemini prompt, model fallback, image loading
│   ├── schemas.py          # validation + status rules + group aggregation
│   └── hardware_rules.py   # preliminary hardware checklist
├── templates/index.html    # web UI
├── tests/test_core.py      # unit tests
├── data/eval_sets/         # 15 sets × 3 photos + manifest.json + SHOTLISTs
├── data/labels_template.csv
├── requirements.txt
└── .env.example
```

### Setup

Requires Python 3.10+ and a Gemini API key ([get one](https://aistudio.google.com/apikey)).

```bash
cd "IMAGE-BASED DECISION"
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt flask
cp .env.example .env               # Windows: copy .env.example .env
```

Edit `.env`:

```
GEMINI_API_KEY=your_key
GEMINI_MODEL=a_vision_capable_model_available_to_your_account
```

If the chosen model fails (not found, quota, unavailable), the code falls back through a built-in model list.

> `flask` is imported by `app.py` but is not listed in `requirements.txt`, so install it as shown above.

### Run

**Web app**
```bash
python app.py
```
Open <http://localhost:5000> (override with `PORT=...`). Upload one or more photos to get the site decision, per-photo findings and the hardware checklist.

**Command line**
```bash
python run_screening.py path/to/photo_or_folder --charger-power-kw 7.2 --charger-type AC
```
Prints JSON with the site decision, per-image results and the hardware recommendation. Accepts JPG, PNG and WEBP up to 15 MB each.

**One click**
`python start.py` (or `start.bat` on Windows, `./start.sh` on Linux/macOS) creates the venv, installs requirements, asks for your key once, runs the tests, then screens the photo or folder you give it. Note that `start.py` does not launch the web app; use `python app.py` for that.

### Evaluation

`data/eval_sets/` holds 15 designed scenarios of 3 photos each: 4 accept, 7 reject (water, exposed wiring, combustibles, cable obstruction, cramped access, burnt/damaged point, mixed), 3 retake (blurry, dark, wrong/blocked) and 1 manual review.

1. Put real photos in each `set_XX/` folder using the filenames listed in its `SHOTLIST.txt`.
2. `python run_eval.py --check` shows which photos are present.
3. `python run_eval.py` runs the model and prints PASS/FAIL per set.

Expected labels are in `manifest.json` and `data/labels_template.csv`. They are **designed scenarios, not expert-reviewed**, so have an electrician confirm them before relying on the results. Photos are git-ignored.

### Tests

```bash
python -m pytest
```

---

## 2. Chatbot (ChargeSathi)

An EV-charging assistant for Indian EV owners, covering charging problems, connectors, chargers and safety.

- **Scope:** answers only EV-charging questions and does not invent error-code meanings.
- **Replies:** in the user's language, under about 150 words, with a severity tag (`[[SEV:low]]`, `[[SEV:medium]]`, `[[SEV:high]]`), likely cause, 3–6 safe troubleshooting steps and a next step.
- **Safety:** gives immediate instructions in emergencies (112 / 101) and never advises bypassing MCB/RCCB protection, opening electrical panels or repairing damaged cables.
- **Backend:** `server.js` streams from Gemini with the system prompt sent as `systemInstruction` (temperature 0.3). `validContents()` checks the conversation structure, roles and length limits. The API key stays on the server.

### Run

Requires Node.js 18+.

```bash
cd CHATBOT
cp .env.example .env     # set GEMINI_API_KEY (and optionally GEMINI_MODEL, PORT)
node server.js           # or: npm start   (Windows: double-click run.bat)
```

Open <http://localhost:3000>. Opening `chargesathi.html` directly runs it in offline mode: a built-in English guide for 6 common problems, plus the emergency warning.

---

## Safety and privacy

- Photos cannot show hidden wiring, earthing, circuit capacity or exact protective-device ratings.
- "Continue" only means no rejection-level *visible* issue was found.
- Validate on expert-labelled, held-out sites before relying on the model.
- Never commit `.env` files or photos of real sites.
