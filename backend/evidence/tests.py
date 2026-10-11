from django.test import SimpleTestCase


class EvidenceEndpointSmokeTest(SimpleTestCase):
    def test_evidence_viewset_exists(self):
        from evidence.views import EvidenceViewSet

        self.assertTrue(callable(EvidenceViewSet))
