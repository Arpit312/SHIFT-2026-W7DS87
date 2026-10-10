import random
import time
from typing import Dict, Any, List

class PhotoCheckService:
    def evaluate(self, evidence_id: str) -> Dict[str, Any]:
        raise NotImplementedError("This is an abstract method.")


class MockPhotoCheckService(PhotoCheckService):
    def evaluate(self, evidence_id: str) -> Dict[str, Any]:
        time.sleep(1)
        random.seed(str(evidence_id))
        score = random.randint(1, 100)
        
        if score > 80:
            status = 'pass'
            feedback = 'Looks good.'
        elif score > 40:
            status = 'needs_review'
            feedback = 'Image is unclear, please review manually.'
        else:
            status = 'fail'
            feedback = 'Clearly violates the criteria.'
            
        return {
            'overall_verdict': status,
            'overall_confidence': score / 100.0,
            'readings': {},
            'findings': [{'observation': feedback, 'severity': 'high' if status == 'fail' else 'low'}],
            'missing_information': [],
            'suggested_conditions': [],
            'requires_human_review': status == 'needs_review',
            'limitations': [],
            'is_demo': True,
            'service_name': 'mock',
            'model_version': '1.0',
            'guard_adjustments': [],
            'raw_response': {}
        }


class RealPhotoCheckService(PhotoCheckService):
    def evaluate(self, evidence_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        from .chargenoc_ai.vision_screening import screen_group
        from .chargenoc_ai.hardware_rules import recommend_hardware
        import tempfile
        import os
        import requests
        
        # evidence_list contains dictionaries with {'url': ..., 'category': ...}
        
        # Download images to temporary files
        temp_files = []
        image_paths = []
        try:
            for ev in evidence_list:
                url = ev['url']
                resp = requests.get(url)
                resp.raise_for_status()
                
                # Create a temp file
                ext = '.jpg' # Assume jpg if we can't guess, or try to get from url
                if '.png' in url.lower(): ext = '.png'
                elif '.webp' in url.lower(): ext = '.webp'
                
                fd, path = tempfile.mkstemp(suffix=ext)
                with os.fdopen(fd, 'wb') as f:
                    f.write(resp.content)
                temp_files.append(path)
                image_paths.append(path)
            
            # Call AI
            screening = screen_group(image_paths)
            hardware = recommend_hardware(screening['group'], charger_power_kw=7.0, charger_type="AC")
            
            group = screening['group']
            
            # Map outputs
            status_map = {
                "CONTINUE_TO_ELECTRICIAN": "pass",
                "MANUAL_REVIEW": "needs_review",
                "CORRECTION_REQUIRED": "fail",
                "RETAKE_PHOTO": "needs_review"
            }
            
            overall_verdict = status_map.get(group['group_status'], "needs_review")
            requires_human_review = group['group_status'] in ("MANUAL_REVIEW", "RETAKE_PHOTO")
            
            # Extract findings
            findings = []
            for h in group['hazards']:
                findings.append({
                    'observation': h['evidence'],
                    'severity': h['severity']
                })
                
            # Guard conditions
            guard_adjustments = []
            if overall_verdict == "pass" and any(f['severity'] in ('high', 'medium') for f in findings):
                overall_verdict = "fail"
                requires_human_review = True
                guard_adjustments.append("Downgraded to fail due to critical hazard.")
                
            return {
                'overall_verdict': overall_verdict,
                'overall_confidence': None, # Model doesn't provide overall confidence
                'readings': {},
                'findings': findings,
                'missing_information': [],
                'suggested_conditions': hardware['hardware_items'],
                'requires_human_review': requires_human_review,
                'limitations': group['limitations'],
                'is_demo': False,
                'service_name': 'google-genai',
                'model_version': os.getenv("GEMINI_MODEL", "unknown"),
                'guard_adjustments': guard_adjustments,
                'raw_response': screening
            }
            
        finally:
            for path in temp_files:
                if os.path.exists(path):
                    os.remove(path)


def get_photo_check_service():
    import os
    backend = os.getenv("PHOTO_CHECK_BACKEND", "mock")
    if backend == "real":
        return RealPhotoCheckService()
    return MockPhotoCheckService()
