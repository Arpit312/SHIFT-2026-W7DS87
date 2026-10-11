"""EV Charging Site Screener: python start.py [photo_or_folder]

Manually provide your own photo or folder of photos for screening.
The model will analyze the image(s) and tell you whether the location
is ready for EV charger installation, or if issues need to be fixed first.

Usage:
  python start.py path/to/photo.jpg
  python start.py path/to/site_folder/

Does everything itself: creates .venv if needed, installs requirements,
reads credentials from .env, runs tests, then screens your image(s).
"""
import os
import subprocess
import sys
import venv
from pathlib import Path

HERE = Path(__file__).resolve().parent
VENV = HERE / ".venv"
PY = VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def run(*cmd):
    return subprocess.call([str(c) for c in cmd], cwd=HERE)


def ensure_env():
    if not PY.exists():
        print(">> Creating virtual environment...")
        venv.create(VENV, with_pip=True)
    print(">> Installing requirements...")
    if run(PY, "-m", "pip", "install", "-q", "-r", "requirements.txt") != 0:
        sys.exit("pip install failed - check your internet connection.")


def ensure_keys():
    env = HERE / ".env"
    vals = {}
    if env.exists():
        for line in env.read_text().splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                vals[k.strip()] = v.strip()
    changed = False
    for k, prompt, bad in (
        ("GEMINI_API_KEY", "Paste your Gemini API key (https://aistudio.google.com/apikey): ", "replace_me"),
        ("GEMINI_MODEL", "Vision-capable Gemini model name (e.g. gemini-2.5-flash): ", "replace_with"),
    ):
        v = os.environ.get(k) or vals.get(k, "")
        if not v or bad in v:
            if not sys.stdin.isatty():
                sys.exit(f"{k} missing. Put it in .env and run again.")
            v = input(prompt).strip()
            if not v:
                sys.exit(f"{k} is required.")
            changed = True
        vals[k] = v
    if changed or not env.exists():
        env.write_text("".join(f"{k}={v}\n" for k, v in vals.items()))
        print(">> Saved .env")


def ask_for_target():
    """Ask the user to provide a photo or folder path interactively."""
    print()
    print("=" * 60)
    print("  EV Charging Site Screener")
    print("=" * 60)
    print()
    print("Provide a photo or a folder of photos of the proposed")
    print("EV charger installation area.")
    print()
    while True:
        path_str = input("Enter image path or folder path: ").strip().strip('"').strip("'")
        if not path_str:
            print("  [!] No path entered. Please try again.")
            continue
        p = Path(path_str)
        if not p.exists():
            print(f"  [!] Path not found: {p}  -- please check and try again.")
            continue
        if p.is_file() and p.suffix.lower() not in IMAGE_EXTS:
            print(f"  [!] Unsupported file type '{p.suffix}'. Use JPG, PNG or WEBP.")
            continue
        if p.is_dir():
            imgs = [f for f in p.iterdir() if f.suffix.lower() in IMAGE_EXTS]
            if not imgs:
                print(f"  [!] No JPG/PNG/WEBP images found in {p}. Please try another folder.")
                continue
            print(f"  >> Found {len(imgs)} image(s) in folder.")
        return str(p)


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else None
    ensure_env()
    print(">> Running tests...")
    if run(PY, "-m", "pytest", "-q", "--tb=short") != 0:
        sys.exit("Tests failed - fix before running the model.")
    ensure_keys()
    if not target:
        if sys.stdin.isatty():
            target = ask_for_target()
        else:
            sys.exit(
                "Usage: python start.py path/to/photo.jpg\n"
                "       python start.py path/to/site_folder/\n"
                "Provide a photo or folder of photos to screen."
            )
    print()
    print(f">> Screening: {target}")
    print("-" * 60)
    sys.exit(run(PY, "run_screening.py", target))


if __name__ == "__main__":
    main()
