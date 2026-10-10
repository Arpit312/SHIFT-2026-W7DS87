from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from scheduling.serializers import *
from scheduling.models import ChargingSlot

