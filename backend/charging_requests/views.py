from rest_framework import viewsets, decorators, response, status
from rest_framework.permissions import IsAuthenticated
from charging_requests.serializers import *
from charging_requests.models import ChargingRequest
from assessments.models import Assessment
import threading

def run_assessment_task(assessment_id):
    from assessments.services import get_photo_check_service
    from evidence.models import Evidence
    
    assessment = Assessment.objects.get(id=assessment_id)
    assessment.status = 'running'
    assessment.save()
    
    try:
        req = assessment.request
        evs = Evidence.objects.filter(request=req)
        # In a real setup, we would generate presigned URLs or get the raw bytes.
        # Since we just mocked Supabase integration in core/authentication.py but didn't implement evidence views fully yet:
        evidence_list = []
        for e in evs:
            # Fake URL or real Supabase public URL if you have one.
            # We'll just assume there's a url or we pass something the adapter can handle
            evidence_list.append({'url': f'https://example.com/fake.jpg', 'category': e.category})
            
        svc = get_photo_check_service()
        result = svc.evaluate(evidence_list)
        
        assessment.overall_verdict = result['overall_verdict']
        assessment.overall_confidence = result['overall_confidence']
        assessment.readings = result['readings']
        assessment.findings = result['findings']
        assessment.missing_information = result['missing_information']
        assessment.suggested_conditions = result['suggested_conditions']
        assessment.requires_human_review = result['requires_human_review']
        assessment.limitations = result['limitations']
        assessment.is_demo = result['is_demo']
        assessment.service_name = result['service_name']
        assessment.model_version = result['model_version']
        assessment.guard_adjustments = result['guard_adjustments']
        assessment.raw_response = result['raw_response']
        assessment.status = 'completed'
        
        if req.status == 'photo_check_pending':
            if assessment.overall_verdict == 'pass':
                req.status = 'awaiting_rwa_decision'
            elif assessment.overall_verdict == 'needs_review':
                req.status = 'review_required'
            else:
                req.status = 'corrective_action_required'
            req.save()
            
    except Exception as e:
        assessment.status = 'failed'
        assessment.error_message = str(e)
    finally:
        assessment.save()


class ChargingRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ChargingRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'ev_owner':
            return ChargingRequest.objects.filter(owner=user)
        elif user.role == 'rwa_admin':
            return ChargingRequest.objects.filter(society=user.society)
        return ChargingRequest.objects.none()

    @decorators.action(detail=True, methods=['post'], url_path='trigger-photo-check')
    def trigger_photo_check(self, request, pk=None):
        req = self.get_object()
        
        if req.status not in ['submitted', 'photo_check_pending']:
            return response.Response({'detail': 'Invalid state'}, status=status.HTTP_400_BAD_REQUEST)
            
        req.status = 'photo_check_pending'
        req.save()
        
        # Idempotency
        assessment = Assessment.objects.filter(request=req, status__in=['pending', 'running']).first()
        if not assessment:
            v = Assessment.objects.filter(request=req).count() + 1
            assessment = Assessment.objects.create(request=req, assessment_version=v, status='pending')
            
            thread = threading.Thread(target=run_assessment_task, args=(assessment.id,))
            thread.daemon = True
            thread.start()
            
        return response.Response({'detail': 'Photo check triggered', 'assessment_id': assessment.id})
