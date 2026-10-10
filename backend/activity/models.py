from django.db import models
import uuid

class ActivityEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey('charging_requests.ChargingRequest', on_delete=models.CASCADE, null=True, blank=True)
    actor = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE)
    event_type = models.CharField(max_length=100)
    description = models.TextField()
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

class DeletionRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requested_by = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE)
    status = models.CharField(max_length=50)
    reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
