import os
import json
from pathlib import Path
from fastapi import HTTPException
from dotenv import load_dotenv
import requests


from src.services.keycloak_client import get_keycloak_client

load_dotenv()


def _load_realm_template() -> dict:
    """Load the realm template from the external JSON file."""
    
    template_path = Path(__file__).resolve().parent.parent / "realm_template.json"
    
    with open(template_path, "r") as f:
        return json.load(f)


class Base_handler:
    def __init__(self):
        
        self.keycloak_url = os.getenv("KEYCLOAK_URL")
        self.admin_secret = os.getenv("CLIENT_SECRET")
        self.web_url = os.getenv("WEB_URL", "http://localhost:3000")
        self.api_url = os.getenv("API_URL", "http://localhost:8080")

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
        return get_keycloak_client().get_admin_token()

    def _make_request(self,method:str,url:str,token:str,params:dict=None,json:dict=None):
        
        headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
            
        r = requests.request(method,url,headers=headers,params=params,json=json)

        try:
            r.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=r.status_code, detail=str(e))
        
        return r