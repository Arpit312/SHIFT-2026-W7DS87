from rest_framework import serializers
from assessments.models import Assessment


class AssessmentSerializer(serializers.ModelSerializer):
    """Read-only serializer.  raw_response is intentionally excluded from
    owner-facing output — it contains the full AI response including internal
    model names and prompt details that should not be returned to clients.
    """

    class Meta:
        model = Assessment
        exclude = ["raw_response"]
        read_only_fields = [
            "id", "request", "assessment_version", "assessed_at",
            "overall_verdict", "overall_confidence", "readings", "findings",
            "missing_information", "suggested_conditions", "requires_human_review",
            "limitations", "is_demo", "service_name", "model_version",
            "guard_adjustments", "status", "task_id", "error_message",
            "created_at",
        ]
