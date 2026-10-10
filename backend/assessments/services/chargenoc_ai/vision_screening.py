import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

from .schemas import validate_result, aggregate_group

MAX_IMAGE_BYTES = 15 * 1024 * 1024
IMAGE_EXTS = {".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}

PROMPT = """Analyze only visible evidence in this proposed EV charging installation-area photo. Do not infer hidden wiring, earthing, circuit capacity, breaker ratings, code compliance, or overall safety. Return JSON with keys: screening_status (RETAKE_PHOTO|MANUAL_REVIEW|CORRECTION_REQUIRED|CONTINUE_TO_ELECTRICIAN), image_quality (usable|blurry|dark|obstructed|irrelevant|uncertain), hazards (array of objects: type [water_or_dampness|exposed_or_damaged_wiring|combustibles_or_fire_hazard|pedestrian_or_cable_obstruction|cramped_or_inaccessible|visible_electrical_hazard|none_visible|uncertain], severity [low|medium|high|unknown], confidence number 0..1, evidence string), summary string, limitations array of strings, requires_electrician true.

Decision rules:
- RETAKE_PHOTO: image is blurry, too dark, obstructed, or not an installation area (selfie, screenshot, unrelated object). Set image_quality accordingly.
- CORRECTION_REQUIRED: a reasonably apparent, material visible hazard (e.g. standing water or wet wall near the install point, bare/damaged/taped-over wires, stored fuel/gas cylinders/paper/cloth stacks next to the install point, cable route across a walkway, no working clearance). Give severity medium or high.
- MANUAL_REVIEW: you cannot tell (partial view, glare, ambiguous object). Add a hazard of type uncertain explaining why.
- CONTINUE_TO_ELECTRICIAN: usable image, no rejection-level visible issue. Use hazards [{type none_visible}] only in this case. Minor cosmetic items may be listed as severity low.
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


def _client_and_model():
    load_dotenv()
    key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL")
    if not key or key == "replace_me":
        raise RuntimeError("Set GEMINI_API_KEY in .env")
    if not model or "replace_with" in model:
        raise RuntimeError("Set GEMINI_MODEL to a vision-capable model available to you")
    return genai.Client(api_key=key), model


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
    client, model = (_client, _model) if _client else _client_and_model()
    contents = [types.Part.from_text(text=PROMPT), types.Part.from_bytes(data=data, mime_type=mime)]
    config = types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1)
    last_err = None
    for _ in range(2):  # one retry on malformed output
        response = client.models.generate_content(model=model, contents=contents, config=config)
        if not response.text:
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
