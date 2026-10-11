from django.urls import include, path
from rest_framework.routers import DefaultRouter

from evidence.views import EvidenceViewSet

router = DefaultRouter()
router.register(r'', EvidenceViewSet, basename='evidence')

urlpatterns = [
    path('', include(router.urls)),
]
