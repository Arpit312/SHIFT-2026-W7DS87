import random
import time

class PhotoCheckService:
    def evaluate(self, evidence_id):
        raise NotImplementedError("This is an abstract method.")


class MockPhotoCheckService(PhotoCheckService):
    def evaluate(self, evidence_id):
        # Simulate network latency
        time.sleep(1)
        
        # Deterministic but varied outcomes based on evidence_id
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
            'status': status,
            'confidence': score,
            'feedback': feedback
        }
