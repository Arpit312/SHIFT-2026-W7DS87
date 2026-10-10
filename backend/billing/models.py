from django.db import models
import uuid

class BillingCycle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    society = models.ForeignKey('societies.Society', on_delete=models.CASCADE, related_name='billing_cycles')
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

class SessionEstimate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slot = models.ForeignKey('scheduling.ChargingSlot', on_delete=models.CASCADE)
    charger_power_kw = models.DecimalField(max_digits=6, decimal_places=2)
    duration_minutes = models.IntegerField()
    estimated_kwh = models.DecimalField(max_digits=8, decimal_places=2)
    meter_reconciliation_factor = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    raw_estimation_error = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    tariff_per_kwh = models.DecimalField(max_digits=6, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE)
    billing_cycle = models.ForeignKey(BillingCycle, on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Dispute(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='disputes')
    raised_by = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE)
    reason = models.TextField()
    status = models.CharField(max_length=50)
    resolution = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
