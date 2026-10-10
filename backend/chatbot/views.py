from rest_framework.exceptions import NotAuthenticated
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsEVOwner
from chatbot.services import ChatbotError, call_gemini, enforce_rate_limit, validate_payload


class ChatView(APIView):
    permission_classes = [IsAuthenticated, IsEVOwner]

    def get_authenticate_header(self, request):
        # DRF turns 401 into 403 unless an authenticate header is advertised.
        return 'Bearer'

    def check_permissions(self, request):
        if not bool(getattr(request.user, 'is_authenticated', False)):
            raise NotAuthenticated()
        super().check_permissions(request)

    def post(self, request):
        try:
            message, history = validate_payload(request.data)
            enforce_rate_limit(str(request.user.id))
            result = call_gemini(message, history)
        except ChatbotError as exc:
            return Response(
                {'detail': exc.message, 'code': exc.code, 'error': True, 'message': exc.message},
                status=exc.http_status,
            )
        return Response(result)
