import jwt
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from accounts.models import Profile

class SupabaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        
        try:
            supabase_secret = getattr(settings, 'SUPABASE_JWT_SECRET', settings.SECRET_KEY)
            options = {"verify_aud": False}
            if settings.DEBUG:
                options["verify_signature"] = False
                
            payload = jwt.decode(
                token, 
                supabase_secret, 
                algorithms=["HS256"],
                options=options
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')

        supabase_user_id = payload.get('sub')
        if not supabase_user_id:
            raise AuthenticationFailed('Token does not contain user ID')

        try:
            profile = Profile.objects.get(supabase_user_id=supabase_user_id)
        except Profile.DoesNotExist:
            # Auto-provision profile from JWT user_metadata for dev/demo purposes
            meta = payload.get('user_metadata', {})
            if meta.get('role'):
                from societies.models import Society
                society_name = meta.get('society_name', 'Demo Society')
                
                # Get or create the society by name
                society, created = Society.objects.get_or_create(
                    name=society_name,
                    defaults={
                        'address': 'Pending Address',
                        'registration_number': 'PENDING'
                    }
                )
                    
                profile = Profile.objects.create(
                    supabase_user_id=supabase_user_id,
                    role=meta.get('role', 'ev_owner'),
                    full_name=meta.get('full_name', 'New User'),
                    phone=meta.get('phone', ''),
                    flat_number=meta.get('flat_number', '101'),
                    society=society
                )
            else:
                raise AuthenticationFailed('User profile not found and no metadata to auto-provision')

        return (profile, token)
