import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chargenoc.settings')
django.setup()

from django.apps import apps
from django.conf import settings

def generate_serializers(app_name):
    app_models = apps.get_app_config(app_name).get_models()
    if not app_models:
        return
    lines = ["from rest_framework import serializers\n"]
    for model in app_models:
        lines.append(f"from {app_name}.models import {model.__name__}")
    
    lines.append("\n")
    for model in app_models:
        lines.append(f"class {model.__name__}Serializer(serializers.ModelSerializer):")
        lines.append("    class Meta:")
        lines.append(f"        model = {model.__name__}")
        lines.append("        fields = '__all__'\n")
    
    with open(f"{app_name}/serializers.py", "w") as f:
        f.write("\n".join(lines))

def generate_views_urls(app_name):
    app_models = apps.get_app_config(app_name).get_models()
    if not app_models:
        return
    
    views_lines = ["from rest_framework import viewsets"]
    views_lines.append("from rest_framework.permissions import IsAuthenticated")
    views_lines.append(f"from {app_name}.serializers import *")
    
    for model in app_models:
        views_lines.append(f"from {app_name}.models import {model.__name__}")
        
    views_lines.append("\n")
    
    urls_lines = ["from django.urls import path, include"]
    urls_lines.append("from rest_framework.routers import DefaultRouter")
    urls_lines.append(f"from {app_name}.views import *")
    urls_lines.append("\nrouter = DefaultRouter()")
    
    for model in app_models:
        model_name = model.__name__
        views_lines.append(f"class {model_name}ViewSet(viewsets.ModelViewSet):")
        views_lines.append(f"    queryset = {model_name}.objects.all()")
        views_lines.append(f"    serializer_class = {model_name}Serializer")
        views_lines.append(f"    permission_classes = [IsAuthenticated]\n")
        
        urls_lines.append(f"router.register(r'{model_name.lower()}s', {model_name}ViewSet)")
    
    urls_lines.append("\nurlpatterns = [")
    urls_lines.append("    path('', include(router.urls)),")
    urls_lines.append("]\n")
    
    with open(f"{app_name}/views.py", "w") as f:
        f.write("\n".join(views_lines))
        
    with open(f"{app_name}/urls.py", "w") as f:
        f.write("\n".join(urls_lines))

app_names = ['accounts', 'societies', 'charging_requests', 'evidence', 'assessments', 'conditions', 'scheduling', 'billing', 'packets', 'activity']
for app in app_names:
    generate_serializers(app)
    generate_views_urls(app)

print("Generated all serializers, views, and urls.")
