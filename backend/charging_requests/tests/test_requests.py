import pytest
from rest_framework.test import APIClient
from societies.models import Society
from accounts.models import Profile, Vehicle
from charging_requests.models import ChargingRequest

@pytest.mark.django_db
class TestChargingRequest:
    def setup_method(self):
        self.client = APIClient()
        self.society = Society.objects.create(name="Test Society", address="Test Addr")
        self.ev_owner = Profile.objects.create(
            supabase_user_id="owner1",
            role="ev_owner",
            full_name="Owner 1",
            society=self.society
        )
        self.vehicle = Vehicle.objects.create(
            owner=self.ev_owner,
            manufacturer="Tata",
            model="Nexon",
            charger_power_kw=7.2
        )
        self.request_obj = ChargingRequest.objects.create(
            request_number="REQ-001",
            owner=self.ev_owner,
            vehicle=self.vehicle,
            society=self.society,
            status="draft"
        )
        
    def test_state_transition(self):
        # A simple test ensuring state can be changed
        assert self.request_obj.status == "draft"
        self.request_obj.status = "submitted"
        self.request_obj.save()
        
        req = ChargingRequest.objects.get(id=self.request_obj.id)
        assert req.status == "submitted"
