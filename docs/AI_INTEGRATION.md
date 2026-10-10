# AI Integration

## Adapter Mapping
The AI outputs are mapped to the Assessment contract in ackend/assessments/services/__init__.py:
- overall_verdict: Mapped from group_status (e.g., CONTINUE_TO_ELECTRICIAN -> pass, CORRECTION_REQUIRED -> ail).
- overall_confidence: The AI model does not provide this globally, so it is set to 
ull to indicate manual review applicability.
- indings: Mapped directly from hazards. 	ype, severity, and vidence are preserved.
- equires_human_review: Derived from the group status (MANUAL_REVIEW or RETAKE_PHOTO).
- limitations: Passed through directly.
- suggested_conditions: Derived from hardware_rules.py's ecommend_hardware function.

## Background Processing
The 	rigger-photo-check endpoint launches a daemon thread un_assessment_task to prevent blocking the HTTP request while the external AI API processes the images.

## Guard Adjustments
If the AI returns a pass verdict but includes a high or medium severity finding, the adapter forcibly downgrades the verdict to ail, sets equires_human_review to True, and appends a note to guard_adjustments.
