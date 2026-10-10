from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        custom_response_data = {
            'error': True,
            'message': 'An error occurred',
            'details': response.data
        }
        
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, str):
                custom_response_data['message'] = exc.detail
            elif isinstance(exc.detail, dict) and 'detail' in exc.detail:
                custom_response_data['message'] = exc.detail['detail']
            
        response.data = custom_response_data

    return response
