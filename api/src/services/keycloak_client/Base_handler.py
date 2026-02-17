import os
import json
import requests
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()


class Base_handler:
    """Base handler with shared configuration and HTTP helpers."""

    def __init__(self):
        self.keycloak_url = os.getenv("KEYCLOAK_URL")
        self.admin_secret = os.getenv("CLIENT_SECRET")

        if not self.keycloak_url:
            raise HTTPException(
                status_code=500, detail="KEYCLOAK_URL environment variable is not set"
            )

    def _make_request(
        self,
        method: str,
        url: str,
        token: str,
        params: dict = None,
        json_data: dict | list = None,
    ) -> requests.Response:
        """Make an authenticated request to Keycloak."""
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        r = requests.request(method, url, headers=headers, params=params, json=json_data)

        try:
            r.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=r.status_code, detail=str(e))

        return r
        

    def get_admin_token(self) -> str:
        """Get admin service account token using client credentials."""
        if not self.admin_secret:
            raise HTTPException(
                status_code=500, detail="CLIENT_SECRET environment variable is not set"
            )

        url = f"{self.keycloak_url}/realms/master/protocol/openid-connect/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": "SecureLearning-admin",
            "client_secret": self.admin_secret,
        }

        try:
            response = requests.post(
                url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            token_data = response.json()
            return token_data.get("access_token")
        except requests.exceptions.RequestException:
            raise HTTPException(status_code=500, detail="Failed to retrieve admin token")
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500, detail="Failed to decode admin token response"
            )
