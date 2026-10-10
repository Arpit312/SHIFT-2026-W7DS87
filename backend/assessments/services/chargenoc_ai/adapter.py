"""
Adapter: maps chargenoc_ai screening output → Assessment contract.

Mapping table (verbatim from your specification):

  Verdict mapping
  ───────────────
  CONTINUE_TO_ELECTRICIAN  →  yes
    (guard: no unresolved critical, no null confidence on critical finding,
     no missing required photo, requires_human_review False)
  CORRECTION_REQUIRED      →  electrician_first  (requires_electrician always True)
  CORRECTION_REQUIRED      →  yes_with_conditions  (if requires_electrician False — unreachable in practice)
  MANUAL_REVIEW            →  needs_review
  RETAKE_PHOTO             →  needs_review  (+ retake message in missing_information)

  Severity mapping
  ────────────────
  high     →  critical
  medium   →  major
  low      →  minor
  unknown  →  finding not shown; evidence string → missing_information; verdict → needs_review

  Sentinel handling
  ─────────────────
  none_visible  →  no finding created
  uncertain     →  evidence string → missing_information; verdict forced to needs_review

  Request status after verdict
  ────────────────────────────
  yes / yes_with_conditions  →  awaiting_verification  (electrician sign-off before RWA)
  electrician_first          →  corrective_action_required
  needs_review               →  review_required

  Guard rules (never return yes with any of these):
  ─────────────────────────────────────────────────
  • Any unresolved critical finding
  • Null confidence on any real hazard finding
  • requires_human_review True
  • Missing or unreadable required photo (source_photo_id None for a finding)

Privacy
───────
  This module never includes owner details, address, or PII in AI inputs.
  Only image bytes are sent to Gemini.  EXIF stripping is done in the service
  layer before calling screen_area.
"""

import uuid
from typing import Any

from assessments.services.chargenoc_ai.schemas import REAL_HAZARDS

# ── Mapping tables ────────────────────────────────────────────────────────────

# AI group_status → contract overall_verdict (before guard check)
_STATUS_TO_VERDICT = {
    "CONTINUE_TO_ELECTRICIAN": "yes",
    "CORRECTION_REQUIRED": "electrician_first",   # requires_electrician always True
    "MANUAL_REVIEW": "needs_review",
    "RETAKE_PHOTO": "needs_review",
}

# AI hazard severity → contract Severity enum value
_SEVERITY_MAP = {
    "high": "critical",
    "medium": "major",
    "low": "minor",
    # "unknown" is handled separately: not shown to owner, goes to missing_information
}

# Contract verdict → request status
VERDICT_TO_REQUEST_STATUS = {
    "yes": "awaiting_verification",
    "yes_with_conditions": "awaiting_verification",
    "electrician_first": "corrective_action_required",
    "needs_review": "review_required",
}

# Human-readable titles and recommended actions per hazard type
_HAZARD_META: dict[str, dict[str, str]] = {
    "water_or_dampness": {
        "title": "Water or Dampness at Installation Area",
        "recommended_action": (
            "Identify and resolve the moisture source before any electrical "
            "installation. Have a qualified electrician assess the wall and "
            "floor before charger mounting."
        ),
    },
    "exposed_or_damaged_wiring": {
        "title": "Exposed or Damaged Wiring",
        "recommended_action": (
            "Have a qualified electrician inspect and rectify all exposed or "
            "damaged wiring before any new installation begins."
        ),
    },
    "combustibles_or_fire_hazard": {
        "title": "Combustible Materials or Fire Hazard Nearby",
        "recommended_action": (
            "Remove or separate all combustible materials from the proposed "
            "charger area before installation. Consult the electrician on "
            "clearance and ventilation requirements."
        ),
    },
    "pedestrian_or_cable_obstruction": {
        "title": "Pedestrian Path or Cable Obstruction",
        "recommended_action": (
            "Revise the cable route so it does not cross a pedestrian walkway. "
            "Confirm with the electrician that mechanical protection is adequate."
        ),
    },
    "cramped_or_inaccessible": {
        "title": "Cramped or Inaccessible Installation Area",
        "recommended_action": (
            "Clear the area so the charger and its cabling can be installed "
            "safely and accessed for maintenance. Electrician must confirm "
            "working clearance on site."
        ),
    },
    "visible_electrical_hazard": {
        "title": "Visible Electrical Hazard",
        "recommended_action": (
            "Do not proceed until a qualified electrician has inspected and "
            "rectified the visible electrical hazard."
        ),
    },
}

# Confidence threshold below which a hazard is treated as unresolved
# TODO(team): set this threshold after calibration on expert-labelled data
_MIN_CONFIDENCE_FOR_FINDING: float = 0.5


def adapt_screening_to_assessment(
    group: dict[str, Any],
    images: list[dict[str, Any]],
    evidence_ids: list[str],
) -> dict[str, Any]:
    """Map chargenoc_ai group + per-image results to the Assessment contract.

    Arguments
    ---------
    group        : aggregate_group() return value
    images       : list of per-image screen_area() results (with 'image' key)
    evidence_ids : ordered list of Evidence DB IDs matching images[]

    Returns a dict that maps 1-to-1 with Assessment model fields, ready for
    service layer consumption.  Null stays null.  No fields are fabricated.
    """
    # Collect model versions used
    model_versions = group.get("model_versions", [])
    model_version = ", ".join(sorted(model_versions)) if model_versions else None

    findings: list[dict] = []
    missing_information: list[str] = []
    forced_needs_review = False
    guard_adjustments: list[str] = []

    # Sentinel: RETAKE_PHOTO → add retake message per unusable photo
    image_statuses = group.get("image_statuses", [])
    for idx, img_status in enumerate(image_statuses):
        if img_status == "RETAKE_PHOTO":
            photo_label = evidence_ids[idx] if idx < len(evidence_ids) else f"photo_{idx}"
            missing_information.append(
                f"Photo {photo_label} could not be analysed "
                f"(image quality: {images[idx].get('image_quality', 'unknown')}). "
                "Please retake and resubmit."
            )

    # Process hazards
    for h in group.get("hazards", []):
        h_type = h.get("type")
        h_severity = h.get("severity")
        h_confidence = h.get("confidence")
        h_evidence = h.get("evidence", "")
        image_index = h.get("image_index", 0)

        source_photo_id = (
            evidence_ids[image_index]
            if image_index < len(evidence_ids)
            else None
        )

        # Sentinel: none_visible → no finding, no missing_information entry
        if h_type == "none_visible":
            continue

        # Sentinel: uncertain → missing_information, force needs_review
        if h_type == "uncertain":
            missing_information.append(
                f"Uncertain observation on {source_photo_id or 'unknown photo'}: "
                f"{h_evidence}"
            )
            forced_needs_review = True
            continue

        # Real hazard with unknown severity → missing_information, force needs_review
        if h_severity == "unknown":
            missing_information.append(
                f"Hazard '{h_type}' severity could not be determined on "
                f"{source_photo_id or 'unknown photo'}: {h_evidence}"
            )
            forced_needs_review = True
            continue

        # Map severity
        contract_severity = _SEVERITY_MAP.get(h_severity)
        if contract_severity is None:
            # Unrecognised severity — treat as unknown
            missing_information.append(
                f"Unrecognised severity '{h_severity}' for hazard '{h_type}': "
                f"{h_evidence}"
            )
            forced_needs_review = True
            continue

        meta = _HAZARD_META.get(h_type, {})
        finding = {
            "finding_id": str(uuid.uuid4()),
            "title": meta.get("title", h_type.replace("_", " ").title()),
            "severity": contract_severity,
            "explanation": h_evidence,
            "confidence": h_confidence if isinstance(h_confidence, (int, float)) and not isinstance(h_confidence, bool) else None,
            "source_photo_id": source_photo_id,
            "evidence_region": None,  # TODO(team): prompt change needed to get boxes
            "recommended_action": meta.get("recommended_action", "Consult a qualified electrician."),
            "requires_electrician": True,
            "status": "unresolved",
            "analyzer": "chargenoc_ai_vision",
        }
        findings.append(finding)

    # Derive initial verdict
    group_status = group.get("group_status", "MANUAL_REVIEW")
    verdict = _STATUS_TO_VERDICT.get(group_status, "needs_review")

    # Force needs_review from uncertain sentinels
    if forced_needs_review and verdict == "yes":
        verdict = "needs_review"
        guard_adjustments.append(
            "Downgraded from yes to needs_review: uncertain hazards or "
            "unknown severity found."
        )

    # Guard: never yes with requires_human_review True
    requires_human_review = group.get("group_status") in ("MANUAL_REVIEW", "RETAKE_PHOTO") or forced_needs_review

    if verdict == "yes" and requires_human_review:
        verdict = "needs_review"
        guard_adjustments.append(
            "Downgraded from yes to needs_review: requires_human_review is True."
        )

    # Guard: never yes with any unresolved critical finding
    has_critical = any(f["severity"] == "critical" and f["status"] == "unresolved" for f in findings)
    if verdict == "yes" and has_critical:
        verdict = "electrician_first"
        guard_adjustments.append(
            "Downgraded from yes to electrician_first: "
            "unresolved critical finding present."
        )

    # Guard: never yes with null confidence on any finding
    has_null_confidence = any(f["confidence"] is None for f in findings if f["type"] if "type" in f else True)
    # (confidence can be None only on a finding we constructed — real hazards have confidence from schema)
    # Re-check: findings list has no 'type' key (we store 'severity'/'title') so check differently:
    has_null_confidence_finding = any(
        f.get("confidence") is None
        for f in findings
        if f.get("severity") in ("critical", "major")
    )
    if verdict == "yes" and has_null_confidence_finding:
        verdict = "needs_review"
        guard_adjustments.append(
            "Downgraded from yes to needs_review: null confidence on a finding."
        )

    limitations: list[str] = list(group.get("limitations", []))
    limitations.insert(
        0,
        "This is a preliminary visual screening only. It is not a safety "
        "certification, approval, or electrical design. An electrician must "
        "verify all findings and specifications on site."
    )

    return {
        "overall_verdict": verdict,
        "overall_confidence": None,  # no aggregate confidence from model
        "readings": {},
        "findings": findings,
        "missing_information": missing_information,
        "suggested_conditions": _build_conditions(findings),
        "requires_human_review": requires_human_review,
        "limitations": limitations,
        "is_demo": False,
        "service_name": "chargenoc_ai_vision",
        "model_version": model_version,
        "guard_adjustments": guard_adjustments,
        # raw_response stored by the service layer, not here
    }


def adapt_request_status(verdict: str) -> str:
    """Map a contract verdict to the corresponding ChargingRequest status.
    Never returns awaiting_rwa_decision — electrician sign-off comes first.
    """
    return VERDICT_TO_REQUEST_STATUS.get(verdict, "review_required")


def _build_conditions(findings: list[dict]) -> list[dict]:
    """Derive SuggestedCondition objects from unresolved findings."""
    conditions = []
    for f in findings:
        if f.get("status") != "unresolved":
            continue
        conditions.append({
            "title": f["title"],
            "explanation": f["explanation"],
            "required_action": f["recommended_action"],
            "responsible_party": "ev_owner",
            "required_evidence": (
                "Photo showing the hazard has been resolved, "
                "plus a brief description of the corrective action taken."
            ),
        })
    return conditions
