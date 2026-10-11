"""Flask web app for ChargeNOC AI — EV Charging Site Screener.
Run: python app.py
Then open http://localhost:8000 in your browser.
"""
import io
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

from chargenoc_ai.hardware_rules import recommend_hardware
from chargenoc_ai.vision_screening import screen_area, _client_and_model

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max per request

ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# Status display config
STATUS_META = {
    "CONTINUE_TO_ELECTRICIAN": {
        "label": "Ready — Continue to Electrician",
        "emoji": "✅",
        "color": "green",
        "description": "No rejection-level visible issues found. An electrician can now survey and install.",
    },
    "MANUAL_REVIEW": {
        "label": "Manual Review Required",
        "emoji": "🔍",
        "color": "yellow",
        "description": "The AI could not make a confident determination. A human reviewer should check this site.",
    },
    "RETAKE_PHOTO": {
        "label": "Retake Photo",
        "emoji": "📷",
        "color": "orange",
        "description": "The photo is too blurry, dark, obstructed, or irrelevant. Please retake and resubmit.",
    },
    "CORRECTION_REQUIRED": {
        "label": "Correction Required",
        "emoji": "🚫",
        "color": "red",
        "description": "A visible hazard was detected. Correct the issue before proceeding with installation.",
    },
}

HAZARD_LABELS = {
    "water_or_dampness": "Water / Dampness",
    "exposed_or_damaged_wiring": "Exposed / Damaged Wiring",
    "combustibles_or_fire_hazard": "Combustibles / Fire Hazard",
    "pedestrian_or_cable_obstruction": "Pedestrian / Cable Obstruction",
    "cramped_or_inaccessible": "Cramped / Inaccessible",
    "visible_electrical_hazard": "Visible Electrical Hazard",
    "none_visible": "None Visible",
    "uncertain": "Uncertain",
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/screen", methods=["POST"])
def screen():
    files = request.files.getlist("images")
    if not files or all(f.filename == "" for f in files):
        return jsonify({"error": "No images uploaded."}), 400

    try:
        client, model = _client_and_model()
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500

    results = []
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        saved_paths = []
        for f in files:
            if not f.filename:
                continue
            ext = Path(f.filename).suffix.lower()
            if ext not in ALLOWED_EXTS:
                return jsonify({"error": f"Unsupported file type '{ext}'. Use JPG, PNG or WEBP."}), 400
            dest = tmp / f.filename
            f.save(dest)
            saved_paths.append((f.filename, dest))

        if not saved_paths:
            return jsonify({"error": "No valid images found in upload."}), 400

        image_results = [None] * len(saved_paths)
        errors = {}

        def _screen(idx_filename_path):
            idx, filename, path = idx_filename_path
            r = screen_area(path, _client=client, _model=model)
            r["filename"] = filename
            return idx, r

        with ThreadPoolExecutor(max_workers=min(len(saved_paths), 4)) as pool:
            futures = {pool.submit(_screen, (i, fn, p)): i for i, (fn, p) in enumerate(saved_paths)}
            for fut in as_completed(futures):
                try:
                    idx, r = fut.result()
                    image_results[idx] = r
                except Exception as e:
                    fn = saved_paths[futures[fut]][0]
                    errors[fn] = str(e)

        if errors:
            first_fn, first_err = next(iter(errors.items()))
            return jsonify({"error": f"Error screening '{first_fn}': {first_err}"}), 500

    # Aggregate group decision
    from chargenoc_ai.schemas import aggregate_group
    group = aggregate_group(image_results)
    hw = recommend_hardware(group)

    status = group["group_status"]
    meta = STATUS_META.get(status, {})

    # Build clean response
    images_out = []
    for r in image_results:
        img_meta = STATUS_META.get(r["screening_status"], {})
        hazards_clean = [
            {
                "type": h["type"],
                "label": HAZARD_LABELS.get(h["type"], h["type"]),
                "severity": h["severity"],
                "confidence": round(h["confidence"] * 100),
                "evidence": h["evidence"],
            }
            for h in r["hazards"]
            if h["type"] != "none_visible"
        ]
        images_out.append({
            "filename": r["filename"],
            "status": r["screening_status"],
            "status_label": img_meta.get("label", r["screening_status"]),
            "status_color": img_meta.get("color", "gray"),
            "quality": r["image_quality"],
            "summary": r["summary"],
            "hazards": hazards_clean,
            "limitations": r["limitations"],
        })

    hw_items = [
        {"category": i["category"].replace("_", " ").title(), "reason": i["reason"]}
        for i in hw["hardware_items"]
    ]

    return jsonify({
        "group_status": status,
        "status_label": meta.get("label", status),
        "status_color": meta.get("color", "gray"),
        "status_emoji": meta.get("emoji", ""),
        "status_description": meta.get("description", ""),
        "image_count": group["image_count"],
        "blocked": hw["blocked_from_installation_progress"],
        "images": images_out,
        "hardware_items": hw_items,
        "limitations": group["limitations"],
        "requires_electrician": True,
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n  ChargeNOC AI — EV Site Screener")
    print(f"  Open your browser: http://localhost:{port}\n")
    app.run(debug=False, port=port)
