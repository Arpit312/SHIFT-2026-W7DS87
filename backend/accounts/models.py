from django.db import models
import uuid

ROLE_CHOICES = (
    ('ev_owner', 'EV Owner'),
    ('rwa_admin', 'RWA Admin'),
    ('electrician', 'Electrician'),
    ('super_admin', 'Super Admin'),
)

class Profile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supabase_user_id = models.CharField(max_length=255, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    society = models.ForeignKey('societies.Society', on_delete=models.CASCADE, null=True, blank=True)
    flat_number = models.CharField(max_length=50, blank=True, null=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_authenticated(self):
        return True

    def __str__(self):
        return self.full_name

class Vehicle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='vehicles')
    manufacturer = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    battery_capacity_kwh = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    charger_power_kw = models.DecimalField(max_digits=6, decimal_places=2)
    charger_rated_voltage = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    manual_url = models.URLField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_authenticated(self):
        return True

    def __str__(self):
        return f"{self.manufacturer} {self.model}"
