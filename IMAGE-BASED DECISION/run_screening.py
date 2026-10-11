import argparse
import json
import sys

from chargenoc_ai.hardware_rules import recommend_hardware
from chargenoc_ai.vision_screening import list_images, screen_group


def main(argv=None):
    p = argparse.ArgumentParser(description="Screen one photo, or a folder of photos for one site.")
    p.add_argument("image", help="image file, or a folder of images for one site")
    p.add_argument("--charger-power-kw", type=float, default=None)
    p.add_argument("--charger-type", default=None, help="AC or DC")
    a = p.parse_args(argv)
    try:
        out = screen_group(list_images(a.image))
        hw = recommend_hardware(out["group"], a.charger_power_kw, a.charger_type)
    except (FileNotFoundError, ValueError, RuntimeError) as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    print(json.dumps({"screening": out["group"], "images": out["images"], "hardware_recommendation": hw}, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
