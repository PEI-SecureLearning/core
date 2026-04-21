import os
import json
from pathlib import Path
from fastapi import HTTPException
from src.core.settings import settings
from src.services.keycloak_client import get_keycloak_client


class base_handler:
    def __init__(self):

        self.keycloak_url = settings.KEYCLOAK_URL
        self.admin_secret = settings.CLIENT_SECRET
        self.web_url = settings.WEB_URL
        self.api_url = settings.API_URL
        self.smtp_password = settings.SMTP_PASSWORD
        self.keycloak_client = get_keycloak_client()

        if not self.keycloak_url:
            raise HTTPException(
                status_code=500, detail="KEYCLOAK_URL environment variable is not set"
            )
        if not self.admin_secret:
            raise HTTPException(
                status_code=500, detail="CLIENT_SECRET environment variable is not set"
            )

    def _get_admin_token(self) -> str:
        """Get admin service account token."""
        return self.keycloak_client.get_admin_token()

    def _load_realm_template(self, **substitutions) -> dict:
        """Load the realm template from the external JSON file.

        Any keyword arguments are used to replace {key} placeholders in the template.
        """

        template_path = Path(__file__).resolve().parent / "realm_template.json"

        with open(template_path, "r") as f:
            raw = f.read()

        for key, value in substitutions.items():
            raw = raw.replace(f"{{{key}}}", value)

        return json.loads(raw)


_instance: base_handler | None = None


def get_base_handler() -> base_handler:
    global _instance
    if _instance is None:
        _instance = base_handler()
    return _instance
