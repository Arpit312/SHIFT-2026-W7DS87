# AI Branch Analysis

## What changed
- **Files**: Added a new AI directory chargenoc_ai with Python modules (hardware_rules.py, schemas.py, ision_screening.py), a Flask app (pp.py), a equirements.txt, launch scripts, and sample images/prompts.
- **Dependencies**: Added google-genai, python-dotenv, and pytest.
- **Environment variables**: Added GEMINI_API_KEY and GEMINI_MODEL to .env.example.
- **Model files/weights**: None (it relies on an external API, Gemini, over the network).

## Delivery form
- The AI was delivered as a standalone Flask HTTP service and an importable Python package (chargenoc_ai).
- **Entry points**: pp.py for Flask; ision_screening.screen_area(image_path) and ision_screening.screen_group(image_paths) for the python modules.

## Input
- **Vision Screening**: Takes a local file path (image_path), loads bytes, and sends them to the Gemini API along with a prompt. The image must be PNG, JPG, or WEBP, up to 15MB.
- **Hardware Rules**: Takes the screening output JSON, charger power, and charger type.

## Output
- **Exact structure**: A JSON dictionary validated by schemas.py.
- **Fields**: screening_status (RETAKE_PHOTO|MANUAL_REVIEW|CORRECTION_REQUIRED|CONTINUE_TO_ELECTRICIAN), image_quality, hazards (array of objects), summary, limitations, equires_electrician.
- **Hazards**: 	ype, severity (low|medium|high|unknown), confidence (float 0-1), vidence.
- **Coordinate convention**: No bounding boxes are returned.

## Dependencies and runtime
- Python library google-genai. No conflict with Django.
- **GPU/RAM**: Minimal. Calls an external API.
- **Latency**: Network call to Gemini API, usually 2-10 seconds per image depending on payload and Google's load.

## Security review
- **Hardcoded secrets**: None. Uses eplace_me in .env.example.
- **Unsafe deserialisation**: None (uses json.loads).
- **File operations**: The AI service reads from disk (image_path) directly, which assumes safe paths.
- **Outbound network**: Yes, sends images to Google's GenAI API. This is a privacy implication as photos leave our system.

## Existing tests
- Assumed to exist given un_eval.py and pytest dependency, testing the model with data/eval_sets.

## Gap table
| Phase 1 Assessment Field | AI Branch Output | Status |
|--------------------------|------------------|--------|
| overall_verdict | screening_status or group_status | Derivable (mapping required) |
| overall_confidence | Not provided directly | Derivable from hazard confidences or Missing |
| indings | hazards | Provided |
| missing_information | Not provided directly | Derivable from image_quality / status |
| suggested_conditions | hardware_items or derived from hazards | Derivable |
| equires_human_review | screening_status == MANUAL_REVIEW | Derivable |
| limitations | limitations | Provided |

## Risks and open questions
- **Privacy**: Sending images to a third-party LLM (Google Gemini). Owner consent text is pending (TODO(team)).
- **Latency**: Synchronous calls might time out if done inline. Background task processing is necessary.
- **No bounding boxes**: The AI doesn't return coordinates, so frontend highlighting will rely on description only.
