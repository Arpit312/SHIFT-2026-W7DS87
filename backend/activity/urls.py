from django.urls import path, include
from rest_framework.routers import DefaultRouter
from activity.views import *

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
]
