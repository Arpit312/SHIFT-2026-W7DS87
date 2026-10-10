from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.models import Profile, Vehicle
from django.forms.models import model_to_dict

class MeView(APIView):
    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        # Ensure we're returning the dict Next.js expects
        data = {
            'id': str(request.user.id),
            'supabase_user_id': request.user.supabase_user_id,
            'role': request.user.role,
            'society_id': str(request.user.society_id) if request.user.society_id else None,
            'society_name': request.user.society.name if request.user.society else '',
            'flat_number': request.user.flat_number,
            'full_name': request.user.full_name,
            'phone': request.user.phone
        }
        return Response(data)

    def patch(self, request):
        return Response(status=status.HTTP_200_OK)

class MeVehiclesView(APIView):
    def get(self, request):
        vehicles = Vehicle.objects.filter(owner=request.user)
        results = []
        for v in vehicles:
            results.append({
                'id': str(v.id),
                'manufacturer': v.manufacturer,
                'model': v.model,
                'battery_capacity_kwh': v.battery_capacity_kwh,
                'charger_power_kw': v.charger_power_kw,
            })
        return Response({'results': results})

    def post(self, request):
        v = Vehicle.objects.create(
            owner=request.user,
            manufacturer=request.data.get('manufacturer'),
            model=request.data.get('model'),
            battery_capacity_kwh=request.data.get('battery_capacity_kwh'),
            charger_power_kw=request.data.get('charger_power_kw')
        )
        return Response({'id': str(v.id)}, status=status.HTTP_201_CREATED)

class MeOverviewView(APIView):
    def get(self, request):
        return Response({
            'active_requests_count': 0,
            'pending_conditions_count': 0,
            'upcoming_slots_count': 0
        })

class MeDeletionRequestView(APIView):
    def post(self, request):
        return Response({'status': 'pending'}, status=status.HTTP_201_CREATED)
