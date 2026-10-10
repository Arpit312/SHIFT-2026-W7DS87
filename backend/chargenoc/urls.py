from django.contrib import admin
from django.urls import path, include
from accounts.views import MeView, MeVehiclesView, MeOverviewView, MeDeletionRequestView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/me/', MeView.as_view()),
    path('api/v1/me/vehicles/', MeVehiclesView.as_view()),
    path('api/v1/me/overview/', MeOverviewView.as_view()),
    path('api/v1/me/deletion-request/', MeDeletionRequestView.as_view()),
    path('api/v1/societies/', include('societies.urls')),
    path('api/v1/requests/', include('charging_requests.urls')),
    path('api/v1/evidence/', include('evidence.urls')),
    path('api/v1/assessments/', include('assessments.urls')),
    path('api/v1/conditions/', include('conditions.urls')),
    path('api/v1/scheduling/', include('scheduling.urls')),
    path('api/v1/billing/', include('billing.urls')),
    path('api/v1/packets/', include('packets.urls')),
    path('api/v1/activity/', include('activity.urls')),
]
