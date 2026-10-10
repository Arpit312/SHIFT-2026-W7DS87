from django.urls import path, include
from rest_framework.routers import DefaultRouter
from charging_requests.views import *

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
]
