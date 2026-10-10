from django.core.management.base import BaseCommand
from societies.models import Society
from accounts.models import Profile, Vehicle
from charging_requests.models import ChargingRequest
import uuid

class Command(BaseCommand):
    help = 'Seed the database with a demo society, users, and requests.'

    def handle(self, *args, **kwargs):
        society, created = Society.objects.get_or_create(
            name="Demo Society",
            address="123 EV Lane",
            registration_number="REG123"
        )
        self.stdout.write(f"Society created: {society.name}")

        super_admin, _ = Profile.objects.get_or_create(
            supabase_user_id="super_admin_id",
            defaults={
                'role': 'super_admin',
                'full_name': 'Super Admin',
                'society': society
            }
        )

        rwa_admin, _ = Profile.objects.get_or_create(
            supabase_user_id="rwa_admin_id",
            defaults={
                'role': 'rwa_admin',
                'full_name': 'RWA Admin',
                'society': society
            }
        )
        
        electrician, _ = Profile.objects.get_or_create(
            supabase_user_id="electrician_id",
            defaults={
                'role': 'electrician',
                'full_name': 'Electrician Bob',
                'society': society
            }
        )

        ev_owner, _ = Profile.objects.get_or_create(
            supabase_user_id="ev_owner_id",
            defaults={
                'role': 'ev_owner',
                'full_name': 'Alice EV Owner',
                'society': society,
                'flat_number': '101'
            }
        )
        
        self.stdout.write("Profiles created.")

        vehicle, _ = Vehicle.objects.get_or_create(
            owner=ev_owner,
            manufacturer="Tesla",
            model="Model 3",
            charger_power_kw=11.0,
            defaults={
                'battery_capacity_kwh': 75.0,
                'charger_rated_voltage': 240.0
            }
        )
        
        req, created = ChargingRequest.objects.get_or_create(
            request_number="REQ-2026-000123",
            owner=ev_owner,
            vehicle=vehicle,
            society=society,
            defaults={
                'status': 'submitted'
            }
        )
        
        self.stdout.write("Seeding completed successfully.")
