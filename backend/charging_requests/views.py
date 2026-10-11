"""
ChargingRequest views.

Key changes in parking-analyzer branch:
  - run_assessment_task now uses real Evidence URLs (via Supabase public URL
    or signed URL) instead of a fake placeholder.
  - Request status after photo-check is set via adapter.adapt_request_status()
    which never jumps to awaiting_rwa_decision directly; electrician sign-off
    comes first.
  - evidence_list passes evidence_id so the adapter can populate source_photo_id.
"""

import logging
import os
import threading
from urllib.parse import quote

import requests
from django.utils import timezone
from rest_framework import decorators, response, status, viewsets
from rest_framework.permissions import IsAuthenticated

from assessments.models import Assessment
from charging_requests.models import ChargingRequest
from charging_requests.serializers import ChargingRequestSerializer

logger = logging.getLogger(__name__)


def _get_evidence_url(evidence) -> str | None:
    """Return a downloadable URL for an Evidence record.

    The Evidence model stores the bucket path as file_key. Prefer a signed URL
    when a Supabase key is configured so private storage buckets still render
    correctly. Fall back to the public object URL when a public bucket is used.
    """
    bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "chargenoc-evidence")
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    if not supabase_url or not evidence.file_key:
        return None

    file_key = evidence.file_key.lstrip("/")
    encoded_key = quote(file_key, safe="/")
    public_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{encoded_key}"

    token = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if token:
        try:
            response = requests.post(
                f"{supabase_url}/storage/v1/object/sign/{bucket}/{encoded_key}",
                json={"expiresIn": 3600},
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": token,
                    "Content-Type": "application/json",
                },
                timeout=10,
            )
            if response.status_code == 200:
                payload = response.json()
                signed_url = (
                    payload.get("signedURL")
                    or payload.get("signed_url")
                    or payload.get("url")
                )
                if signed_url:
                    return signed_url
        except requests.RequestException:
            logger.warning(
                "Falling back to public URL for evidence %s because a signed URL could not be generated.",
                evidence.evidence_id,
            )

    return public_url


def run_assessment_task(assessment_id: str) -> None:
    """Background thread: runs the photo check and saves results to Assessment."""
    from assessments.services import get_photo_check_service
    from assessments.services.chargenoc_ai.adapter import adapt_request_status
    from evidence.models import Evidence

    assessment = Assessment.objects.get(id=assessment_id)
    assessment.status = "running"
    assessment.save(update_fields=["status"])

    try:
        req = assessment.request
        evs = Evidence.objects.filter(request=req).order_by("created_at")

        evidence_list = []
        for e in evs:
            url = _get_evidence_url(e)
            if not url:
                logger.warning(
                    "Evidence %s has no URL (SUPABASE_URL not set?), skipping.",
                    e.evidence_id,
                )
                continue
            evidence_list.append({
                "url": url,
                "category": e.category,
                "evidence_id": e.evidence_id,
            })

        svc = get_photo_check_service()
        result = svc.evaluate(evidence_list)

        assessment.overall_verdict = result["overall_verdict"]
        assessment.overall_confidence = result["overall_confidence"]
        assessment.readings = result["readings"]
        assessment.findings = result["findings"]
        assessment.missing_information = result["missing_information"]
        assessment.suggested_conditions = result["suggested_conditions"]
        assessment.requires_human_review = result["requires_human_review"]
        assessment.limitations = result["limitations"]
        assessment.is_demo = result["is_demo"]
        assessment.service_name = result["service_name"]
        assessment.model_version = result["model_version"]
        assessment.guard_adjustments = result["guard_adjustments"]
        assessment.raw_response = result["raw_response"]
        assessment.status = "completed"

        # Map verdict → request status.
        # Never jumps to awaiting_rwa_decision — electrician sign-off first.
        if req.status == "photo_check_pending":
            req.status = adapt_request_status(result["overall_verdict"])
            req.save(update_fields=["status", "updated_at"])

    except Exception as e:  # noqa: BLE001
        logger.exception("Assessment task failed for %s", assessment_id)
        assessment.status = "failed"
        assessment.error_message = str(e)
    finally:
        assessment.save()


class ChargingRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ChargingRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "ev_owner":
            return ChargingRequest.objects.filter(owner=user)
        elif user.role == "rwa_admin":
            return ChargingRequest.objects.filter(society=user.society)
        return ChargingRequest.objects.none()

    @decorators.action(detail=True, methods=["post"], url_path="submit")
    def submit_request(self, request, pk=None):
        req = self.get_object()
        if req.status not in ("draft", "submitted"):
            return response.Response(
                {"detail": "Request cannot be submitted in its current state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        req.status = "submitted"
        req.submitted_at = timezone.now()
        req.save(update_fields=["status", "submitted_at", "updated_at"])
        return response.Response({"detail": "Request submitted.", "status": req.status})

    @decorators.action(detail=True, methods=["post"], url_path="trigger-photo-check")
    def trigger_photo_check(self, request, pk=None):
        req = self.get_object()

        if req.status not in ("submitted", "photo_check_pending"):
            return response.Response(
                {"detail": "Invalid state for photo check trigger."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        req.status = "photo_check_pending"
        req.save(update_fields=["status", "updated_at"])

        # Idempotency: reuse an in-flight assessment if one exists
        existing = Assessment.objects.filter(
            request=req, status__in=("pending", "running")
        ).first()
        if existing:
            return response.Response(
                {
                    "detail": "Photo check already in progress.",
                    "assessment_id": str(existing.id),
                }
            )

        v = Assessment.objects.filter(request=req).count() + 1
        assessment = Assessment.objects.create(
            request=req, assessment_version=v, status="pending"
        )

        thread = threading.Thread(
            target=run_assessment_task,
            args=(str(assessment.id),),
            daemon=True,
        )
        thread.start()

        return response.Response(
            {
                "detail": "Photo check triggered.",
                "assessment_id": str(assessment.id),
            }
        )
