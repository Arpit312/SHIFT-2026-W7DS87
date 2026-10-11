import json
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai import errors as genai_errors

from .schemas import validate_result, aggregate_group

MAX_IMAGE_BYTES = 15 * 1024 * 1024
IMAGE_EXTS = {".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}

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


MODELS = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-flash-latest",
]


def _client_and_model():
    load_dotenv()
    key = os.getenv("GEMINI_API_KEY")
    env_model = os.getenv("GEMINI_MODEL")
    if not key or key == "replace_me":
        raise RuntimeError("Set GEMINI_API_KEY in .env")

    models = []
    if env_model and "replace_with" not in env_model:
        models.append(env_model)
    for m in MODELS:
        if m not in models:
            models.append(m)

    return genai.Client(api_key=key), models


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
        raise ValueError(f"Image too large ({len(data) // 1024 // 1024} MB > {MAX_IMAGE_BYTES // 1024 // 1024} MB): {p}")
    return data, mime


def screen_area(image_path, _client=None, _model=None):
    data, mime = _load_image(image_path)
    if _client:
        client = _client
        if _model is None:
            models = list(MODELS)
        elif isinstance(_model, (list, tuple)):
            models = list(_model)
        else:
            models = [str(_model)]
    else:
        client, env_models = _client_and_model()
        if _model is None:
            models = env_models
        elif isinstance(_model, (list, tuple)):
            models = list(_model)
        else:
            models = [str(_model)] + [m for m in env_models if m != str(_model)]

    contents = [types.Part.from_text(text=PROMPT), types.Part.from_bytes(data=data, mime_type=mime)]
    config = types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1)
    last_err = None

    for current_model in models:
        for attempt in range(2):
            try:
                response = client.models.generate_content(model=current_model, contents=contents, config=config)
            except genai_errors.ServerError as e:
                last_err = e
                if "503" in str(e) or "UNAVAILABLE" in str(e):
                    if attempt < 1:
                        time.sleep(1)
                        continue
                break
            except (genai_errors.ClientError, genai_errors.APIError) as e:
                last_err = e
                # 404 Not Found, unsupported, 429 quota, etc. -> try next model in list
                break
            except Exception as e:
                last_err = e
                break

            if not response or not getattr(response, "text", None):
                last_err = ValueError("Empty vision-model response (possibly blocked by safety filter)")
                continue

            try:
                return validate_result(_parse_json(response.text))
            except (ValueError, json.JSONDecodeError) as e:
                last_err = e

    raise ValueError(f"Vision model gave no usable result for {image_path}: {last_err}")


def list_images(path):
    """A file -> [file]; a folder -> its images sorted by name."""
    p = Path(path)
    if p.is_dir():
        files = sorted(f for f in p.iterdir() if f.suffix.lower() in IMAGE_EXTS)
        if not files:
            raise FileNotFoundError(f"No JPG/PNG/WEBP images in {p}")
        return files
    return [p]


def screen_group(image_paths, **kw):
    """Screen several photos of one site and return per-image results plus one group decision."""
    results = []
    for path in image_paths:
        r = screen_area(path, **kw)
        r["image"] = str(path)
        results.append(r)
    return {"images": results, "group": aggregate_group(results)}
