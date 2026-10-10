from django.db import models
import uuid

class Evidence(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    evidence_id = models.CharField(max_length=50, unique=True)
    request = models.ForeignKey('charging_requests.ChargingRequest', on_delete=models.CASCADE, related_name='evidence')
    category = models.CharField(max_length=50)
    file_key = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size_bytes = models.PositiveIntegerField()
    uploaded_by = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE)
    linked_finding_id = models.CharField(max_length=100, null=True, blank=True)
    is_corrective = models.BooleanField(default=False)
    condition_addressed = models.ForeignKey('conditions.Condition', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.evidence_id
