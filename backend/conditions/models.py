from django.db import models
import uuid

CONDITION_STATUS_CHOICES = (
    ('pending', 'Pending'),
    ('proof_submitted', 'Proof Submitted'),
    ('under_review', 'Under Review'),
    ('verified', 'Verified'),
    ('rework_required', 'Rework Required'),
)

class Condition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey('charging_requests.ChargingRequest', on_delete=models.CASCADE, related_name='conditions')
    title = models.CharField(max_length=255)
    explanation = models.TextField()
    required_action = models.TextField()
    responsible_party = models.CharField(max_length=100)
    required_evidence = models.TextField()
    deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=CONDITION_STATUS_CHOICES, default='pending')
    source_finding_id = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class ConditionEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    condition = models.ForeignKey(Condition, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=50)
    actor = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ReviewDecision(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey('charging_requests.ChargingRequest', on_delete=models.CASCADE, related_name='decisions')
    decision = models.CharField(max_length=50)
    decided_by = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE)
    comments = models.TextField(blank=True, null=True)
    conditions_text = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
