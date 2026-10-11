from rest_framework import serializers

from evidence.models import Evidence


class EvidenceSerializer(serializers.ModelSerializer):
    request = serializers.PrimaryKeyRelatedField(read_only=True)
    uploaded_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Evidence
        fields = [
            'id',
            'evidence_id',
            'request',
            'category',
            'file_key',
            'file_type',
            'file_size_bytes',
            'uploaded_by',
            'linked_finding_id',
            'is_corrective',
            'condition_addressed',
            'created_at',
        ]
        read_only_fields = (
            'id',
            'evidence_id',
            'request',
            'uploaded_by',
            'created_at',
        )

