from rest_framework import serializers
from charging_requests.models import ChargingRequest

class ChargingRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChargingRequest
        fields = '__all__'
