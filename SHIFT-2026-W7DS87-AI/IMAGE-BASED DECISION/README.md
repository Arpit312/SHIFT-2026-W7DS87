# ChargeNOC AI Model Starter

Model-only prototype: vision-based visible-risk screening + rule-based preliminary hardware checklist. No Django, React, electrician assignment, notifications, or deployment.

## Setup
Python 3.10+. Create a venv, install `requirements.txt`, copy `.env.example` to `.env`, set `GEMINI_API_KEY` and a vision-capable `GEMINI_MODEL` available to your account.

Run: `python run_screening.py path/to/area.jpg --charger-power-kw 7.2 --charger-type AC`

Statuses: `RETAKE_PHOTO`, `MANUAL_REVIEW`, `CORRECTION_REQUIRED`, `CONTINUE_TO_ELECTRICIAN`. Continue means only that no rejection-level visible issue was identified; it is not a safety certification.

Photos cannot establish hidden wiring, earthing, circuit capacity, or exact protective-device ratings. Hardware suggestions are categories only; electrician verification is mandatory. Evaluate on expert-labelled, held-out sites before relying on the model. Do not commit `.env` or sensitive photos.

## Screening a site (group of photos)
`python run_screening.py path/to/site_folder --charger-power-kw 7.2 --charger-type AC` screens every JPG/PNG/WEBP in the folder (a single file also works) and returns one site decision. Priority: any visible hazard → `CORRECTION_REQUIRED`; else any unusable photo → `RETAKE_PHOTO`; else any uncertainty → `MANUAL_REVIEW`; `CONTINUE_TO_ELECTRICIAN` only if every photo is clean.

Model output is re-checked in code (`schemas.py`): a medium/high visible hazard forces `CORRECTION_REQUIRED` even if the model said continue; contradictory or low-confidence output goes to `MANUAL_REVIEW`.

## 15 evaluation sets
`data/eval_sets/` has 15 sets × 3 photos: 4 accept, 7 reject (water, exposed wiring, combustibles, cable obstruction, cramped access, burnt/damaged point, mixed group), 3 retake (blurry, dark, wrong/blocked), 1 manual review. Each `set_XX/SHOTLIST.txt` says which photo to put there and the expected result; `manifest.json` and `data/labels_template.csv` hold the expected labels (designed scenarios, not expert-reviewed — have an electrician confirm before trusting them).

Put real photos in the set folders with the listed names, then `python run_eval.py --check` (which are present) and `python run_eval.py` (runs the model, PASS/FAIL per set). Tests: `python -m pytest`.

## One-click start
`python start.py` (or double-click `start.bat` on Windows, `./start.sh` on Linux/Mac) sets up the venv, installs packages, asks for the Gemini key/model once, runs tests, then runs the 15 eval sets. `python start.py path/to/photo_or_folder` screens that instead.
