from django.db import models
import uuid

STATUS_CHOICES = (
    ('draft', 'Draft'),
    ('submitted', 'Submitted'),
    ('photo_check_pending', 'Photo Check Pending'),
    ('review_required', 'Review Required'),
    ('corrective_action_required', 'Corrective Action Required'),
    ('awaiting_verification', 'Awaiting Verification'),
    ('awaiting_rwa_decision', 'Awaiting RWA Decision'),
    ('approved', 'Approved'),
    ('approved_with_conditions', 'Approved with Conditions'),
    ('rejected', 'Rejected'),
    ('closed', 'Closed'),
)

class ChargingRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request_number = models.CharField(max_length=50, unique=True)
    owner = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE, related_name='requests')
    vehicle = models.ForeignKey('accounts.Vehicle', on_delete=models.CASCADE)
    society = models.ForeignKey('societies.Society', on_delete=models.CASCADE)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='draft')
    site_questionnaire = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.request_number
