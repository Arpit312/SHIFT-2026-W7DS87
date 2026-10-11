import json
from types import SimpleNamespace
from pathlib import Path

import pytest

from chargenoc_ai.schemas import validate_result, aggregate_group
from chargenoc_ai.hardware_rules import recommend_hardware
from chargenoc_ai import vision_screening as vs


def res(status="CONTINUE_TO_ELECTRICIAN", quality="usable", hazards=None, summary="ok", limitations=None):
    return {"screening_status": status, "image_quality": quality,
            "hazards": hazards if hazards is not None else [{"type": "none_visible", "severity": "low", "confidence": 0.9, "evidence": "clear"}],
            "summary": summary, "limitations": limitations or []}


def hz(t, sev="high", conf=0.9):
    return {"type": t, "severity": sev, "confidence": conf, "evidence": "seen"}


def test_valid_continue():
    r = validate_result(res())
    assert r["screening_status"] == "CONTINUE_TO_ELECTRICIAN" and r["requires_electrician"] is True


def test_non_dict_hazard_rejected():
    with pytest.raises(ValueError):
        validate_result(res(hazards=["water"]))


def test_bool_confidence_rejected():
    with pytest.raises(ValueError):
        validate_result(res(hazards=[{"type": "water_or_dampness", "severity": "high", "confidence": True, "evidence": "x"}]))


def test_bad_quality_forces_retake():
    assert validate_result(res(quality="Blurry"))["screening_status"] == "RETAKE_PHOTO"


def test_continue_with_high_hazard_upgraded():
    r = validate_result(res(hazards=[hz("water_or_dampness")]))
    assert r["screening_status"] == "CORRECTION_REQUIRED"


def test_hazard_beats_uncertain_quality():
    assert validate_result(res(quality="uncertain", hazards=[hz("exposed_or_damaged_wiring")]))["screening_status"] == "CORRECTION_REQUIRED"


def test_correction_without_hazard_downgraded():
    assert validate_result(res(status="CORRECTION_REQUIRED"))["screening_status"] == "MANUAL_REVIEW"


def test_none_visible_plus_hazard_contradiction():
    r = validate_result(res(hazards=[hz("water_or_dampness", "low"), hz("none_visible", "low")]))
    assert r["screening_status"] == "MANUAL_REVIEW"


def test_low_confidence_hazard_goes_to_manual():
    assert validate_result(res(hazards=[hz("water_or_dampness", "high", 0.2)]))["screening_status"] == "MANUAL_REVIEW"


def test_forbidden_claim_flagged_and_input_not_mutated():
    inp = res(summary="Area is risk-free")
    r = validate_result(inp)
    assert r["limitations"] and inp["limitations"] == []


def test_aggregate_priorities():
    a = lambda s: {"screening_status": s, "hazards": [], "limitations": []}
    assert aggregate_group([a("CONTINUE_TO_ELECTRICIAN"), a("CONTINUE_TO_ELECTRICIAN")])["group_status"] == "CONTINUE_TO_ELECTRICIAN"
    assert aggregate_group([a("CONTINUE_TO_ELECTRICIAN"), a("MANUAL_REVIEW")])["group_status"] == "MANUAL_REVIEW"
    assert aggregate_group([a("MANUAL_REVIEW"), a("RETAKE_PHOTO")])["group_status"] == "RETAKE_PHOTO"
    assert aggregate_group([a("RETAKE_PHOTO"), a("CORRECTION_REQUIRED")])["group_status"] == "CORRECTION_REQUIRED"
    with pytest.raises(ValueError):
        aggregate_group([])


def test_hardware_hazard_items_and_blocking():
    r = validate_result(res(hazards=[hz("combustibles_or_fire_hazard"), hz("exposed_or_damaged_wiring")]))
    hw = recommend_hardware(r, 7.2, "ac")
    cats = {i["category"] for i in hw["hardware_items"]}
    assert {"fire_risk_clearance_review", "existing_wiring_condition_review"} <= cats
    assert hw["blocked_from_installation_progress"] is True and hw["input_context"]["charger_type"] == "AC"


def test_hardware_accepts_group_result_and_validates_inputs():
    g = aggregate_group([validate_result(res())])
    assert recommend_hardware(g)["blocked_from_installation_progress"] is False
    with pytest.raises(ValueError):
        recommend_hardware(g, -3)
    with pytest.raises(ValueError):
        recommend_hardware(g, 7, "XYZ")


def test_parse_json_fenced_and_wrapped():
    assert vs._parse_json('```json\n{"a": 1}\n```') == {"a": 1}
    assert vs._parse_json('Here: {"a": 1} thanks') == {"a": 1}
    with pytest.raises(ValueError):
        vs._parse_json("nope")


class FakeClient:
    def __init__(self, texts):
        self.texts = list(texts)
        self.calls = 0
        self.models = self

    def generate_content(self, **kw):
        self.calls += 1
        return SimpleNamespace(text=self.texts.pop(0))


def test_screen_area_retries_then_succeeds(tmp_path):
    img = tmp_path / "a.jpg"
    img.write_bytes(b"\xff\xd8\xff")
    c = FakeClient(["garbage", json.dumps(res())])
    assert vs.screen_area(img, _client=c, _model="m")["screening_status"] == "CONTINUE_TO_ELECTRICIAN"
    assert c.calls == 2


def test_screen_area_gives_up(tmp_path):
    img = tmp_path / "a.png"
    img.write_bytes(b"x")
    with pytest.raises(ValueError):
        vs.screen_area(img, _client=FakeClient(["", ""]), _model="m")


def test_image_checks(tmp_path):
    with pytest.raises(FileNotFoundError):
        vs._load_image(tmp_path / "none.jpg")
    bad = tmp_path / "a.gif"; bad.write_bytes(b"x")
    with pytest.raises(ValueError):
        vs._load_image(bad)
    empty = tmp_path / "e.jpg"; empty.write_bytes(b"")
    with pytest.raises(ValueError):
        vs._load_image(empty)


def test_manifest_has_15_sets_of_3():
    m = json.loads((Path(__file__).parent.parent / "data/eval_sets/manifest.json").read_text())
    assert len(m["sets"]) == 15 and all(len(s["images"]) == 3 for s in m["sets"])
    # expected group status must equal aggregate of expected image statuses
    for s in m["sets"]:
        g = aggregate_group([{"screening_status": i["expected_status"], "hazards": [], "limitations": []} for i in s["images"]])
        assert g["group_status"] == s["expected_group_status"], s["set_id"]
