from django.db import models
import uuid

class Packet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey('charging_requests.ChargingRequest', on_delete=models.CASCADE, related_name='packets')
    version = models.IntegerField(default=1)
    file_key = models.CharField(max_length=255)
    generated_by = models.ForeignKey('accounts.Profile', on_delete=models.CASCADE)
    sections_included = models.JSONField(default=list)
    disclaimer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Packet {self.version} for {self.request.request_number}"
