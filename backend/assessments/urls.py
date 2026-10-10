from django.urls import path, include
from rest_framework.routers import DefaultRouter
from assessments.views import AssessmentViewSet

router = DefaultRouter()
router.register(r"", AssessmentViewSet, basename="assessments")

urlpatterns = [
    path("", include(router.urls)),
]
