from django.db import models
import uuid

class ChargingSlot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey('charging_requests.ChargingRequest', on_delete=models.CASCADE, related_name='slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_minutes = models.IntegerField()
    charger_power_kw = models.DecimalField(max_digits=6, decimal_places=2)
    status = models.CharField(max_length=50)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
