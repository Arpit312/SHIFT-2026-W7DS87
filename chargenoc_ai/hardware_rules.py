BASE = [
    ("charging_socket_or_connector", "Confirm EVSE plug, voltage/current, duty rating and environmental suitability.", "charger/EVSE model; voltage/current; environment"),
    ("cable_and_conduit", "Sizing depends on design current, route length, installation method, voltage drop and derating.", "charger current; route length; installation method; supply details"),
    ("circuit_breaker", "Rating and breaking capacity must be coordinated with cable and fault-current conditions.", "charger current; cable design; supply/fault-current data"),
    ("residual_current_protection", "Select protection based on EVSE requirements and applicable standards, including DC fault-current requirements.", "EVSE protection specification; upstream protection; applicable standard"),
    ("enclosure_glands_mounting", "Confirm ingress/mechanical protection and mounting based on actual environment.", "indoor/outdoor exposure; mounting surface; cable entry"),
    ("earthing_and_bonding_check", "Existing earthing and continuity require on-site inspection and appropriate tests.", "earthing arrangement; test results"),
]

# (hazard types that trigger it) -> (category, reason, missing inputs)
HAZARD_ITEMS = [
    ({"water_or_dampness"}, "water_exposure_mitigation_review", "Visible moisture requires site assessment and correction before equipment selection.", ["source of moisture", "environmental exposure"]),
    ({"pedestrian_or_cable_obstruction", "cramped_or_inaccessible"}, "cable_route_and_access_review", "Review cable routing, mechanical protection, clearance and pedestrian access.", ["measured route", "clearance assessment"]),
    ({"exposed_or_damaged_wiring", "visible_electrical_hazard"}, "existing_wiring_condition_review", "Visible wiring/electrical damage must be inspected and rectified by a qualified electrician before any connection.", ["extent of damage", "circuit identification", "inspection report"]),
    ({"combustibles_or_fire_hazard"}, "fire_risk_clearance_review", "Visible combustible material or fire hazard near the install area; remove or separate before equipment selection.", ["material type", "separation distance", "ventilation"]),
]

VALID_CHARGER_TYPES = {"AC", "DC"}
BLOCKING_STATUSES = {"RETAKE_PHOTO", "MANUAL_REVIEW", "CORRECTION_REQUIRED"}


def _item(category, reason, missing):
    return {"category": category, "preliminary_specification": None, "reason": reason, "missing_inputs": list(missing), "status": "AI_SUGGESTED", "requires_electrician_verification": True}


def recommend_hardware(screening, charger_power_kw=None, charger_type=None):
    # Accept either a single-image result or a group result.
    status = screening.get("screening_status") or screening.get("group_status")
    if status is None:
        raise ValueError("screening has no screening_status/group_status")
    if charger_power_kw is not None and (isinstance(charger_power_kw, bool) or not isinstance(charger_power_kw, (int, float)) or charger_power_kw <= 0):
        raise ValueError("charger_power_kw must be a positive number")
    if charger_type is not None:
        charger_type = str(charger_type).strip().upper()
        if charger_type not in VALID_CHARGER_TYPES:
            raise ValueError("charger_type must be AC or DC")
    hazards = screening.get("hazards", [])
    found = {h.get("type") for h in hazards}

    items = [_item(c, r, [x.strip() for x in m.split(";")]) for c, r, m in BASE]
    for triggers, category, reason, missing in HAZARD_ITEMS:
        if found & triggers:
            items.append(_item(category, reason, missing))
    if charger_type == "DC":
        items.append(_item("dc_fast_charger_supply_review", "DC chargers need a dedicated three-phase supply and supplier-specified protection; verify against the manufacturer's installation manual.", ["manufacturer installation manual", "supply capacity", "fault-current data"]))

    return {
        "recommendation_status": "PRELIMINARY_ONLY",
        "screening_status": status,
        "hardware_items": items,
        "input_context": {"charger_power_kw": charger_power_kw, "charger_type": charger_type},
        "blocked_from_installation_progress": status in BLOCKING_STATUSES,
        "notice": "Preliminary checklist only—not an electrical design, final bill of materials, safety certification or installation permission. Electrician must verify all specifications.",
    }
