"""
Vision screening module — upgraded from proj/chargenoc_ai/vision_screening.py.

Changes vs. the previous backend version:
  1. Prompt extended with explicit water-seepage / efflorescence inspection points.
  2. Model fallback: reads GEMINI_MODELS (comma-separated) from the environment;
     falls back to a built-in list.  Tries each model in order on 4xx / quota
     errors; retries the same model once on 503.
  3. Per-model error handling: ServerError, ClientError, APIError caught
     separately so quota exhaustion on one model does not abort the whole call.
  4. model_version returned in the result (the name of the model that answered).
  5. Total wall-clock timeout via GEMINI_TIMEOUT_SECONDS (default 30 s).
  6. GEMINI_MAX_RETRIES_PER_MODEL controls JSON-parse retries (default 2).

No absolute Windows paths.  No hardcoded keys.  No pickle / eval.
"""

import json
import logging
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai import errors as genai_errors

from .schemas import validate_result, aggregate_group

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 15 * 1024 * 1024
IMAGE_EXTS = {".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}

# Fallback model list used when GEMINI_MODELS env var is absent or empty.
# TODO(team): verify these model names are available to your Gemini account.
_FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
]

PROMPT = """Analyze only visible evidence in this proposed EV charging installation-area photo. Do not infer hidden wiring, earthing, circuit capacity, breaker ratings, code compliance, or overall safety. Return JSON with keys: screening_status (RETAKE_PHOTO|MANUAL_REVIEW|CORRECTION_REQUIRED|CONTINUE_TO_ELECTRICIAN), image_quality (usable|blurry|dark|obstructed|irrelevant|uncertain), hazards (array of objects: type [water_or_dampness|exposed_or_damaged_wiring|combustibles_or_fire_hazard|pedestrian_or_cable_obstruction|cramped_or_inaccessible|visible_electrical_hazard|none_visible|uncertain], severity [low|medium|high|unknown], confidence number 0..1, evidence string), summary string, limitations array of strings, requires_electrician true.

Critical visual inspection points:
- Scrutinize the mounting wall, pillars, beams, ceiling, and overhead pipe runs for water seepage streaks, moisture trails, rust/brown water marks, damp patches, efflorescence, wall cracks, or plumbing leaks above or on the wall.
- Water seepage streaks, moisture trails, damp wall staining, or wall cracks where electrical equipment or chargers would be mounted are material hazards (type: water_or_dampness). Grade severity as medium or high.

Decision rules:
- RETAKE_PHOTO: image is blurry, too dark, obstructed, or not an installation area (selfie, screenshot, unrelated object). Set image_quality accordingly.
- CORRECTION_REQUIRED: a reasonably apparent, material visible hazard (e.g. water seepage / moisture streak / dampness / cracks on the wall or floor, plumbing leak risk, bare/damaged/taped-over wires, stored combustibles, cable route across a walkway, no working clearance). Give severity medium or high.
- MANUAL_REVIEW: you cannot tell (partial view, glare, ambiguous object, or suspicious wall stains needing on-site specialist check). Add a hazard of type uncertain explaining why.
- CONTINUE_TO_ELECTRICIAN: usable image, wall and floor are sound, clean, and completely dry with no visible hazards. Use hazards [{type none_visible}] only in this case.
Never say safe, risk-free, certified, or approved. A photo cannot prove hidden electrical conditions. Include none_visible only if no listed hazard is visible. Output JSON only."""


def _parse_json(text):
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.I).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, flags=re.S)
        if m:
            return json.loads(m.group(0))
        raise ValueError("Vision model did not return valid JSON")


def _get_models_from_env():
    """Return ordered model list: GEMINI_MODELS env var first, then fallback list."""
    load_dotenv()
    env_models_str = os.getenv("GEMINI_MODELS", "").strip()
    env_single = os.getenv("GEMINI_MODEL", "").strip()

    models = []
    if env_models_str:
        for m in env_models_str.split(","):
            m = m.strip()
            if m and m not in models:
                models.append(m)
    elif env_single and "replace_with" not in env_single:
        models.append(env_single)

    for m in _FALLBACK_MODELS:
        if m not in models:
            models.append(m)
    return models


def _client_and_model():
    """Return (client, ordered_model_list).  Raises if no API key is set."""
    load_dotenv()
    key = os.getenv("GEMINI_API_KEY")
    if not key or key.strip() in ("", "replace_me", "replace-me"):
        raise RuntimeError(
            "GEMINI_API_KEY is not set in the environment. "
            "Add it to backend/.env (see backend/.env.example)."
        )
    return genai.Client(api_key=key), _get_models_from_env()


def _load_image(image_path):
    p = Path(image_path)
    if not p.is_file():
        raise FileNotFoundError(p)
    mime = IMAGE_EXTS.get(p.suffix.lower())
    if not mime:
        raise ValueError("Use JPG, PNG or WEBP image")
    data = p.read_bytes()
    if not data:
        raise ValueError(f"Image file is empty: {p}")
    if len(data) > MAX_IMAGE_BYTES:
        raise ValueError(
            f"Image too large ({len(data) // 1024 // 1024} MB "
            f"> {MAX_IMAGE_BYTES // 1024 // 1024} MB): {p}"
        )
    return data, mime


def screen_area(image_path, _client=None, _model=None):
    """Screen one image.  Returns validated result dict with an extra
    'model_version' key holding the name of the model that responded.

    _client / _model are injection points for tests only.
    """
    data, mime = _load_image(image_path)

    timeout = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "30"))
    max_retries = int(os.getenv("GEMINI_MAX_RETRIES_PER_MODEL", "2"))

    if _client:
        client = _client
        if _model is None:
            models = list(_FALLBACK_MODELS)
        elif isinstance(_model, (list, tuple)):
            models = list(_model)
        else:
            models = [str(_model)]
    else:
        client, models = _client_and_model()

    contents = [
        types.Part.from_text(text=PROMPT),
        types.Part.from_bytes(data=data, mime_type=mime),
    ]
    config = types.GenerateContentConfig(
        response_mime_type="application/json", temperature=0.1
    )
    last_err = None
    deadline = time.monotonic() + timeout

    for current_model in models:
        if time.monotonic() >= deadline:
            break
        for attempt in range(max_retries):
            if time.monotonic() >= deadline:
                break
            try:
                response = client.models.generate_content(
                    model=current_model, contents=contents, config=config
                )
            except genai_errors.ServerError as e:
                last_err = e
                if "503" in str(e) or "UNAVAILABLE" in str(e):
                    if attempt < max_retries - 1:
                        time.sleep(1)
                        continue
                break  # move to next model
            except (genai_errors.ClientError, genai_errors.APIError) as e:
                last_err = e
                # 404 Not Found, unsupported model, 429 quota → try next model
                logger.warning(
                    "Gemini model %s rejected with %s, trying next model",
                    current_model, e,
                )
                break
            except Exception as e:  # noqa: BLE001
                last_err = e
                break

            if not response or not getattr(response, "text", None):
                last_err = ValueError(
                    "Empty vision-model response (possibly blocked by safety filter)"
                )
                continue

            try:
                result = validate_result(_parse_json(response.text))
                result["model_version"] = current_model
                return result
            except (ValueError, json.JSONDecodeError) as e:
                last_err = e
                # malformed JSON → retry same model (up to max_retries)
                continue

    raise ValueError(
        f"Vision model gave no usable result for {image_path}: {last_err}"
    )


def list_images(path):
    """A file → [file]; a folder → its images sorted by name."""
    p = Path(path)
    if p.is_dir():
        files = sorted(f for f in p.iterdir() if f.suffix.lower() in IMAGE_EXTS)
        if not files:
            raise FileNotFoundError(f"No JPG/PNG/WEBP images in {p}")
        return files
    return [p]


def screen_group(image_paths, **kw):
    """Screen several photos of one site and return per-image results plus one
    group decision.  Each per-image result carries 'image' (path string) and
    'model_version' (the Gemini model that answered for that image).
    """
    results = []
    for path in image_paths:
        r = screen_area(path, **kw)
        r["image"] = str(path)
        results.append(r)
    group = aggregate_group(results)
    # Store the set of model versions used
    group["model_versions"] = sorted(
        {r.get("model_version", "unknown") for r in results}
    )
    return {"images": results, "group": group}
