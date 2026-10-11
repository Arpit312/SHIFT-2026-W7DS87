from django.utils import timezone
from rest_framework import serializers

from accounts.models import Vehicle
from charging_requests.models import ChargingRequest


class ChargingRequestSerializer(serializers.ModelSerializer):
    vehicle_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = ChargingRequest
        fields = (
            'id',
            'request_number',
            'owner',
            'vehicle',
            'vehicle_id',
            'society',
            'status',
            'site_questionnaire',
            'created_at',
            'updated_at',
            'submitted_at',
        )
        read_only_fields = (
            'id',
            'request_number',
            'owner',
            'vehicle',
            'society',
            'status',
            'created_at',
            'updated_at',
            'submitted_at',
        )

    def _generate_request_number(self):
        stamp = timezone.now().strftime('%Y%m%d')
        count = ChargingRequest.objects.filter(request_number__startswith=f'REQ-{stamp}-').count() + 1
        return f'REQ-{stamp}-{count:04d}'

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not getattr(request, 'user', None):
            raise serializers.ValidationError({'detail': 'Authentication required.'})

        user = request.user
        if not getattr(user, 'society', None):
            raise serializers.ValidationError({'detail': 'User must belong to a society before creating a request.'})

        attrs['owner'] = user
        attrs['society'] = user.society

        vehicle_id = self.initial_data.get('vehicle_id') or attrs.get('vehicle_id')
        if vehicle_id:
            try:
                vehicle = Vehicle.objects.get(id=vehicle_id, owner=user)
            except Vehicle.DoesNotExist:
                raise serializers.ValidationError({'vehicle_id': 'Vehicle not found or does not belong to this owner.'})
            attrs['vehicle'] = vehicle

        if 'vehicle' not in attrs:
            raise serializers.ValidationError({'vehicle_id': 'This field is required.'})

        attrs['site_questionnaire'] = attrs.get('site_questionnaire') or {}
        attrs['status'] = attrs.get('status', 'draft')
        attrs['request_number'] = attrs.get('request_number') or self._generate_request_number()
        return attrs
