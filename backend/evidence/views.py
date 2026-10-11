import uuid

from django.core.exceptions import ValidationError
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from charging_requests.models import ChargingRequest
from evidence.models import Evidence
from evidence.serializers import EvidenceSerializer


class EvidenceViewSet(viewsets.ModelViewSet):
    queryset = Evidence.objects.select_related('request', 'uploaded_by')
    serializer_class = EvidenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset
        request_pk = self.kwargs.get('request_pk')
        if request_pk:
            qs = qs.filter(request_id=request_pk)

        user = self.request.user
        if user.role == 'ev_owner':
            return qs.filter(request__owner=user)
        if user.role == 'rwa_admin':
            return qs.filter(request__society=user.society)
        return qs.filter(uploaded_by=user)

    def perform_create(self, serializer):
        request_pk = self.kwargs.get('request_pk') or self.request.data.get('request_id')
        if not request_pk:
            raise ValidationError({'request_id': 'A request ID is required.'})

        try:
            charging_request = ChargingRequest.objects.get(pk=request_pk)
        except ChargingRequest.DoesNotExist as exc:
            raise ValidationError({'request_id': 'Request not found.'}) from exc

        serializer.save(
            request=charging_request,
            uploaded_by=self.request.user,
            evidence_id=f'EV-{uuid.uuid4().hex[:8].upper()}',
        )

