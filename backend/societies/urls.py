from django.urls import path, include
from rest_framework.routers import DefaultRouter
from societies.views import *

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
]
