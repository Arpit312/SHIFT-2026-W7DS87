import os

base_dir = r"d:\IIT BHU\website\backend"
apps = [
    "core", "accounts", "societies", "charging_requests", "evidence",
    "assessments", "conditions", "scheduling", "billing", "packets", "activity"
]

os.makedirs(os.path.join(base_dir, "chargenoc"), exist_ok=True)
for app in apps:
    app_dir = os.path.join(base_dir, app)
    os.makedirs(app_dir, exist_ok=True)
    with open(os.path.join(app_dir, "__init__.py"), "w") as f:
        pass
    with open(os.path.join(app_dir, "apps.py"), "w") as f:
        f.write(f"from django.apps import AppConfig\n\nclass {app.title().replace('_', '')}Config(AppConfig):\n    name = '{app}'\n    default_auto_field = 'django.db.models.BigAutoField'\n")
    with open(os.path.join(app_dir, "models.py"), "w") as f:
        f.write("from django.db import models\nimport uuid\n")
