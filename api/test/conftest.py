"""Test configuration and shared fixtures."""

import os
import sys
from pathlib import Path

# Default backend env for test collection/imports.
os.environ.setdefault("KEYCLOAK_URL", "http://localhost:8080")
os.environ.setdefault("KEYCLOAK_INTERNAL_URL", "http://localhost:8080")
os.environ.setdefault("KEYCLOAK_ISSUER_URL", "http://localhost:8080/realms/master")
os.environ.setdefault("CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("WEB_URL", "http://localhost:5173")
os.environ.setdefault("API_URL", "http://localhost:8000")
os.environ.setdefault("POSTGRES_SERVER", "localhost")
os.environ.setdefault("POSTGRES_USER", "testuser")
os.environ.setdefault("POSTGRES_PASSWORD", "testpassword")
os.environ.setdefault("POSTGRES_DB", "test")
os.environ.setdefault("RABBITMQ_HOST", "localhost")
os.environ.setdefault("RABBITMQ_USER", "guest")
os.environ.setdefault("RABBITMQ_PASS", "guest")
os.environ.setdefault("RABBITMQ_QUEUE", "email_queue")

# Add both root and src to path for imports
root_path = Path(__file__).parent.parent
src_path = root_path / "src"
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(src_path))
