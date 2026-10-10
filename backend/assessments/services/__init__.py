"""
Photo Check service layer.

Two implementations:
  MockPhotoCheckService   — returns fabricated data for local dev/testing.
  RealPhotoCheckService   — downloads evidence, strips EXIF, calls Gemini,
                             maps result through the adapter.

Use get_photo_check_service() to obtain the correct implementation based on
the PHOTO_CHECK_BACKEND environment variable.

No absolute paths.  No hardcoded keys.  EXIF stripped before sending to Gemini.
"""

import logging
import os
import tempfile
from io import BytesIO
from typing import Any

logger = logging.getLogger(__name__)


# ── Abstract base ─────────────────────────────────────────────────────────────

class PhotoCheckService:
    def evaluate(self, evidence_list: list[dict[str, Any]]) -> dict[str, Any]:
        raise NotImplementedError


# ── Mock implementation ───────────────────────────────────────────────────────

class MockPhotoCheckService(PhotoCheckService):
    """Returns deterministic mock data.  is_demo=True always.  No network calls."""

    def evaluate(self, evidence_list: list[dict[str, Any]]) -> dict[str, Any]:
        import random
        import time

        time.sleep(0.2)
        random.seed(str(sorted(e.get("category", "") for e in evidence_list)))
        score = random.randint(1, 100)

        if score > 80:
            verdict = "yes"
            finding_severity = "minor"
            explanation = "No visible rejection-level issue found. Electrician must verify on site."
        elif score > 40:
            verdict = "needs_review"
            finding_severity = "major"
            explanation = "Image quality or visible condition requires manual review."
        else:
            verdict = "electrician_first"
            finding_severity = "critical"
            explanation = "A potential visible hazard was detected. Electrician inspection required before proceeding."

        return {
            "overall_verdict": verdict,
            "overall_confidence": None,
            "readings": {},
            "findings": [
                {
                    "finding_id": "mock-finding-001",
                    "title": "Mock Finding",
                    "severity": finding_severity,
                    "explanation": explanation,
                    "confidence": score / 100.0,
                    "source_photo_id": None,
                    "evidence_region": None,
                    "recommended_action": "This is mock data. No real action required.",
                    "requires_electrician": True,
                    "status": "unresolved",
                    "analyzer": "mock",
                }
            ],
            "missing_information": [],
            "suggested_conditions": [],
            "requires_human_review": verdict == "needs_review",
            "limitations": [
                "This is mock data generated for development/testing. "
                "It does not reflect a real photo analysis."
            ],
            "is_demo": True,
            "service_name": "mock",
            "model_version": "mock-1.0",
            "guard_adjustments": [],
            "raw_response": {},
        }


# ── Real implementation ───────────────────────────────────────────────────────

class RealPhotoCheckService(PhotoCheckService):
    """Downloads evidence from URLs, strips EXIF, calls Gemini vision, adapts result."""

    def evaluate(self, evidence_list: list[dict[str, Any]]) -> dict[str, Any]:
        from assessments.services.chargenoc_ai.vision_screening import screen_group
        from assessments.services.chargenoc_ai.adapter import adapt_screening_to_assessment

        temp_files: list[str] = []
        image_paths: list[str] = []
        evidence_ids: list[str] = []

        try:
            for ev in evidence_list:
                url = ev.get("url")
                evidence_id = ev.get("evidence_id", "")
                if not url:
                    logger.warning("Evidence entry has no URL, skipping: %s", ev)
                    continue

                ext = _ext_from_url(url)
                raw_bytes = _fetch_image(url)
                stripped_bytes = _strip_exif(raw_bytes, ext)

                fd, path = tempfile.mkstemp(suffix=ext)
                try:
                    with os.fdopen(fd, "wb") as f:
                        f.write(stripped_bytes)
                except Exception:
                    os.close(fd)
                    raise
                temp_files.append(path)
                image_paths.append(path)
                evidence_ids.append(evidence_id)

            if not image_paths:
                raise ValueError("No readable evidence images found for this request.")

            screening = screen_group(image_paths)
            group = screening["group"]
            images = screening["images"]

            result = adapt_screening_to_assessment(group, images, evidence_ids)
            result["raw_response"] = {
                "group_status": group.get("group_status"),
                "image_count": group.get("image_count"),
                "image_statuses": group.get("image_statuses"),
                "model_versions": group.get("model_versions"),
                # Hazards and limitations are stored in findings/limitations fields.
                # Full raw response is not returned to EV owners.
            }
            return result

        finally:
            for path in temp_files:
                try:
                    if os.path.exists(path):
                        os.remove(path)
                except OSError:
                    pass


# ── Helpers ───────────────────────────────────────────────────────────────────

def _ext_from_url(url: str) -> str:
    url_lower = url.lower().split("?")[0]
    for ext in (".png", ".webp", ".jpeg", ".jpg"):
        if url_lower.endswith(ext):
            return ext
    return ".jpg"


def _fetch_image(url: str) -> bytes:
    import requests  # already in django ecosystem via supabase

    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.content


def _strip_exif(image_bytes: bytes, ext: str) -> bytes:
    """Strip EXIF metadata using Pillow before sending to a cloud provider.
    Returns the cleaned image bytes.  Falls back to original bytes if Pillow
    cannot process the image (e.g. already stripped or unsupported format).
    Privacy: removes GPS, device model, and any other EXIF tags.
    """
    try:
        from PIL import Image

        bio = BytesIO(image_bytes)
        img = Image.open(bio)
        # Re-save without EXIF
        out = BytesIO()
        fmt = {".png": "PNG", ".webp": "WEBP"}.get(ext.lower(), "JPEG")
        # Pillow saves without EXIF when exif= kwarg is omitted
        img.save(out, format=fmt)
        return out.getvalue()
    except Exception as exc:  # noqa: BLE001
        logger.warning("EXIF stripping failed (%s), sending original bytes.", exc)
        return image_bytes


# ── Factory ───────────────────────────────────────────────────────────────────

def get_photo_check_service() -> PhotoCheckService:
    backend = os.getenv("PHOTO_CHECK_BACKEND", "mock").strip().lower()
    if backend == "real":
        return RealPhotoCheckService()
    return MockPhotoCheckService()
