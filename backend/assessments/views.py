from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated

from assessments.serializers import AssessmentSerializer
from assessments.models import Assessment


class AssessmentViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """Read-only assessment viewset.

    Routes:
      GET /api/v1/assessments/<id>/
      GET /api/v1/requests/<request_pk>/assessments/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = AssessmentSerializer

    def get_queryset(self):
        user = self.request.user

        # Base queryset filtered by role
        if user.role == "ev_owner":
            qs = Assessment.objects.filter(request__owner=user)
        elif user.role == "rwa_admin":
            qs = Assessment.objects.filter(request__society=user.society)
        else:
            return Assessment.objects.none()

        # Nested route: /requests/<request_pk>/assessments/
        request_pk = self.kwargs.get("request_pk")
        if request_pk:
            qs = qs.filter(request_id=request_pk)

        return qs.order_by("-assessed_at")
