from django.contrib import admin
from django.urls import path, include
from accounts.views import MeView, MeVehiclesView, MeOverviewView, MeDeletionRequestView
from chatbot.views import ChatView
from rest_framework.routers import DefaultRouter
from assessments.views import AssessmentViewSet

# Nested assessments route: GET /api/v1/requests/<request_pk>/assessments/
_assessment_router = DefaultRouter()
_assessment_router.register(r"assessments", AssessmentViewSet, basename="request-assessments")

# Nested evidence route: registered only if EvidenceViewSet exists
try:
    from evidence.views import EvidenceViewSet  # noqa: F401
    _evidence_router = DefaultRouter()
    _evidence_router.register(r"evidence", EvidenceViewSet, basename="request-evidence")
    _evidence_patterns = _evidence_router.urls
except (ImportError, AttributeError):
    _evidence_patterns = []

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/chat/', ChatView.as_view()),
    path('api/v1/me/', MeView.as_view()),
    path('api/v1/me/vehicles/', MeVehiclesView.as_view()),
    path('api/v1/me/overview/', MeOverviewView.as_view()),
    path('api/v1/me/deletion-request/', MeDeletionRequestView.as_view()),
    path('api/v1/societies/', include('societies.urls')),
    path('api/v1/requests/', include('charging_requests.urls')),
    path('api/v1/requests/<str:request_pk>/', include(_assessment_router.urls)),
    path('api/v1/requests/<str:request_pk>/', include(_evidence_patterns)),
    path('api/v1/evidence/', include('evidence.urls')),
    path('api/v1/assessments/', include('assessments.urls')),
    path('api/v1/conditions/', include('conditions.urls')),
    path('api/v1/scheduling/', include('scheduling.urls')),
    path('api/v1/billing/', include('billing.urls')),
    path('api/v1/packets/', include('packets.urls')),
    path('api/v1/activity/', include('activity.urls')),
]
