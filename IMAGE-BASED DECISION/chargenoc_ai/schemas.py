SCREENING_STATUSES = {"RETAKE_PHOTO", "MANUAL_REVIEW", "CORRECTION_REQUIRED", "CONTINUE_TO_ELECTRICIAN"}
HAZARD_TYPES = {
    "water_or_dampness", "exposed_or_damaged_wiring", "combustibles_or_fire_hazard",
    "pedestrian_or_cable_obstruction", "cramped_or_inaccessible", "visible_electrical_hazard",
    "none_visible", "uncertain",
}
IMAGE_QUALITIES = {"usable", "blurry", "dark", "obstructed", "irrelevant", "uncertain"}
SEVERITIES = {"low", "medium", "high", "unknown"}
BAD_QUALITIES = {"blurry", "dark", "obstructed", "irrelevant"}
# Hazards that are real findings (not "nothing seen" / "not sure").
REAL_HAZARDS = HAZARD_TYPES - {"none_visible", "uncertain"}
FORBIDDEN_CLAIMS = ("risk-free", "risk free", "certified", "approved", "guaranteed safe", "is safe", "are safe", "completely safe")
MIN_CONFIDENCE = 0.5  # real hazard below this -> human decides


def _is_number(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def validate_result(data):
    """Validate a model result and enforce status consistency. Returns a normalised copy."""
    if not isinstance(data, dict):
        raise ValueError("Model result must be a JSON object")
    data = dict(data)
    required = {"screening_status", "image_quality", "hazards", "summary", "limitations"}
    missing = required - set(data)
    if missing:
        raise ValueError(f"Missing keys: {sorted(missing)}")
    if data["screening_status"] not in SCREENING_STATUSES:
        raise ValueError("Invalid status")
    quality = str(data["image_quality"]).strip().lower()
    if quality not in IMAGE_QUALITIES:
        raise ValueError(f"Invalid image_quality: {data['image_quality']!r}")
    data["image_quality"] = quality
    if not isinstance(data["hazards"], list):
        raise ValueError("hazards must be a list")
    if not isinstance(data["summary"], str):
        raise ValueError("summary must be a string")
    if isinstance(data["limitations"], str):
        data["limitations"] = [data["limitations"]]
    if not isinstance(data["limitations"], list) or not all(isinstance(x, str) for x in data["limitations"]):
        raise ValueError("limitations must be a list of strings")
    data["limitations"] = list(data["limitations"])

    hazards = []
    for h in data["hazards"]:
        if not isinstance(h, dict):
            raise ValueError("Each hazard must be an object")
        if h.get("type") not in HAZARD_TYPES:
            raise ValueError("Invalid hazard type")
        if h.get("severity") not in SEVERITIES:
            raise ValueError("Invalid severity")
        if not _is_number(h.get("confidence")) or not 0 <= h["confidence"] <= 1:
            raise ValueError("Invalid confidence")
        if not isinstance(h.get("evidence"), str):
            raise ValueError("Missing evidence")
        hazards.append(dict(h))
    data["hazards"] = hazards

    types = {h["type"] for h in hazards}
    real = [h for h in hazards if h["type"] in REAL_HAZARDS]
    status = data["screening_status"]

    # Decide the status. Order matters: unusable photo > real visible hazard > uncertainty > continue.
    if quality in BAD_QUALITIES:
        status = "RETAKE_PHOTO"
    elif real and any(h["severity"] in {"medium", "high"} and h["confidence"] >= MIN_CONFIDENCE for h in real):
        status = "CORRECTION_REQUIRED"
    elif quality == "uncertain" or "uncertain" in types:
        status = "MANUAL_REVIEW"
    elif real and any(h["severity"] == "unknown" or h["confidence"] < MIN_CONFIDENCE for h in real):
        status = "MANUAL_REVIEW"  # a hazard we cannot grade reliably
    elif "none_visible" in types and real:
        status = "MANUAL_REVIEW"  # contradictory: "nothing visible" together with a hazard
    elif real and any(h["severity"] == "low" for h in real) and status == "CONTINUE_TO_ELECTRICIAN":
        status = "MANUAL_REVIEW"  # real hazard observed, cannot blindly clear as ready
    elif status == "CORRECTION_REQUIRED":
        status = "MANUAL_REVIEW"  # model asked for correction but gave no material hazard
    elif status == "RETAKE_PHOTO":
        status = "MANUAL_REVIEW"  # model asked for retake but image quality is usable
    # else: model said MANUAL_REVIEW or CONTINUE and nothing contradicts it -> keep.
    data["screening_status"] = status

    text = data["summary"].lower()
    if any(w in text for w in FORBIDDEN_CLAIMS):
        data["limitations"].append("Summary wording was flagged: this screening is not a safety certification or approval.")
    data["requires_electrician"] = True
    return data


def aggregate_group(results):
    """Combine per-image results of one site (a group of photos) into one decision.

    Visible hazard in any photo -> CORRECTION_REQUIRED (no retake needed to act on it).
    Otherwise any unusable photo -> RETAKE_PHOTO, then any uncertainty -> MANUAL_REVIEW.
    CONTINUE_TO_ELECTRICIAN only when every photo is clean.
    """
    if not results:
        raise ValueError("No images to aggregate")
    statuses = [r["screening_status"] for r in results]
    for s in ("CORRECTION_REQUIRED", "RETAKE_PHOTO", "MANUAL_REVIEW"):
        if s in statuses:
            group_status = s
            break
    else:
        group_status = "CONTINUE_TO_ELECTRICIAN"
    hazards = []
    for i, r in enumerate(results):
        for h in r["hazards"]:
            hazards.append({**h, "image_index": i})
    return {
        "group_status": group_status,
        "image_count": len(results),
        "image_statuses": statuses,
        "hazards": hazards,
        "limitations": sorted({x for r in results for x in r["limitations"]}),
        "requires_electrician": True,
    }
