from django.db import models
import uuid

class Assessment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey('charging_requests.ChargingRequest', on_delete=models.CASCADE, related_name='assessments')
    assessment_version = models.IntegerField(default=1)
    assessed_at = models.DateTimeField(auto_now_add=True)
    overall_verdict = models.CharField(max_length=50)
    overall_confidence = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    readings = models.JSONField(default=dict)
    findings = models.JSONField(default=list)
    missing_information = models.JSONField(default=list)
    suggested_conditions = models.JSONField(default=list)
    requires_human_review = models.BooleanField(default=False)
    limitations = models.JSONField(default=list)
    
    # AI Tracking
    is_demo = models.BooleanField(default=False)
    service_name = models.CharField(max_length=100, default='mock')
    model_version = models.CharField(max_length=100, null=True, blank=True)
    guard_adjustments = models.JSONField(default=list)
    raw_response = models.JSONField(default=dict)
    
    # Task Tracking
    status = models.CharField(max_length=20, default='completed') # pending, running, completed, failed
    task_id = models.CharField(max_length=100, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Assessment {self.assessment_version} for {self.request.request_number}"
