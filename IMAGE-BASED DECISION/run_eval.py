"""Run the 15 evaluation sets in data/eval_sets and compare with expected accept/reject decisions.

Sets whose photos are not yet in place are skipped (listed as MISSING).
Use --check to only verify which photos are present, without calling the model.
"""
import argparse
import json
import sys
from pathlib import Path

from chargenoc_ai.vision_screening import screen_group

ROOT = Path(__file__).parent / "data" / "eval_sets"


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="only list which photos are present")
    a = ap.parse_args(argv)
    manifest = json.loads((ROOT / "manifest.json").read_text())
    ok = bad = missing = 0
    for s in manifest["sets"]:
        paths = [ROOT / i["file"] for i in s["images"]]
        absent = [p.name for p in paths if not p.is_file()]
        if absent:
            missing += 1
            print(f"{s['set_id']} MISSING {absent}  ({s['title']})")
            continue
        if a.check:
            print(f"{s['set_id']} photos present  ({s['title']})")
            continue
        try:
            out = screen_group(paths)
        except (ValueError, RuntimeError) as e:
            print(f"{s['set_id']} ERROR {e}", file=sys.stderr)
            return 1
        got, want = out["group"]["group_status"], s["expected_group_status"]
        flag = "PASS" if got == want else "FAIL"
        ok += got == want
        bad += got != want
        print(f"{s['set_id']} {flag} expected={want} got={got}  ({s['title']})")
    if not a.check:
        print(f"\npass={ok} fail={bad} missing={missing}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
