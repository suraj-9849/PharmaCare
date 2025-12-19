#!/usr/bin/env python3
"""
Quick validation script for AWS Bedrock + PharmaCare AI setup
"""

import os
from dotenv import load_dotenv

# Load env vars
load_dotenv()

print("=" * 60)
print("PharmaCare AI Assistant - AWS Bedrock Setup Validation")
print("=" * 60)

# Check environment variables
checks = {
    "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID"),
    "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY"),
    "AWS_REGION": os.getenv("AWS_REGION"),
    "BEDROCK_MODEL_ID": os.getenv("BEDROCK_MODEL_ID"),
    "BEDROCK_REGION": os.getenv("BEDROCK_REGION"),
    "DATABASE_URL": os.getenv("DATABASE_URL"),
}

print("\n1. Environment Variables:")
print("-" * 60)
for key, value in checks.items():
    status = "✓" if value else "✗"
    if value and "SECRET" in key:
        display = value[:10] + "..." if len(value) > 10 else value
    elif value and "URL" in key:
        display = value.split("@")[0] + "...@..." if "@" in value else value[:20] + "..."
    else:
        display = value
    print(f"{status} {key:<25} = {display}")

# Check Python packages
print("\n2. Required Python Packages:")
print("-" * 60)
packages_to_check = [
    "fastapi",
    "langchain",
    "langchain_aws",
    "langchain_core",
    "langgraph",
    "boto3",
    "sqlalchemy",
    "psycopg2",
    "pandas",
    "dotenv",
]

import importlib
missing = []
for pkg in packages_to_check:
    try:
        mod = importlib.import_module(pkg.replace("_", "-"))
        print(f"✓ {pkg:<25} installed")
    except ImportError:
        print(f"✗ {pkg:<25} MISSING")
        missing.append(pkg)

# Summary
print("\n" + "=" * 60)
if missing:
    print("STATUS: ⚠️  Some packages are missing.")
    print(f"\nInstall missing packages with:")
    print(f"pip install {' '.join(missing)}")
    print("\nOr reinstall requirements:")
    print("pip install -r requirements.txt")
else:
    all_vars_set = all(checks.values())
    if all_vars_set:
        print("STATUS: ✓ Setup complete! All checks passed.")
        print("\nYou can now start the AI assistant:")
        print("  cd ai_assistant")
        print("  python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    else:
        print("STATUS: ⚠️  Environment variables missing or incomplete.")
        print("Check your .env file and ensure all required variables are set.")

print("=" * 60)
