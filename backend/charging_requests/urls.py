from django.urls import path, include
from rest_framework.routers import DefaultRouter
from charging_requests.views import *

router = DefaultRouter()
router.register(r'', ChargingRequestViewSet, basename='requests')
urlpatterns = [
    path('', include(router.urls)),
]
