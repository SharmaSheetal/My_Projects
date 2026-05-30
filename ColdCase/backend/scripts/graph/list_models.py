"""
Quick script to list all available Google Generative AI models
that support embedContent — run this to find the correct model name.

Usage:
    python list_models.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import google.generativeai as genai
from backend.config import settings

genai.configure(api_key=settings.gemini_api_key)

print("Models that support embedContent:\n")
for model in genai.list_models():
    if "embedContent" in model.supported_generation_methods:
        print(f"  name             : {model.name}")
        print(f"  display_name     : {model.display_name}")
        print(f"  description      : {model.description}")
        print()