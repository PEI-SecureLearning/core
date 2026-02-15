import logging
import os
import jwt
import requests
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, Request

oauth_2_scheme = OAuth2PasswordBearer(tokenUrl="token")

AUTH_SERVER_URL = os.getenv("KEYCLOAK_URL")
RESOURCE_SERVER_ID = "api"

class Roles:
    """
    Uses UMA (uma-ticket) to validate permissions in Keycloak.
    """

    def __init__(self, resource: str, scope: str):
        self.resource = resource
        self.scope = scope

    async def __call__(self, request: Request, access_token: str = Depends(oauth_2_scheme)):

        try:
            decoded = jwt.decode(
                access_token,
                options={"verify_signature": False, "verify_aud": False},
            )
        except Exception as e:
            logging.error(f"Failed to decode token: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")

        realm_name = self._extract_realm_name(decoded)

        permission = f"{self.resource}#{self.scope}"

        if not self.check_keycloak_permission(access_token, permission, realm_name):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied for '{permission}'",
            )

        return {"authorized": True}


    def check_keycloak_permission(self, access_token: str, permission: str, realm_name: str) -> bool:
        """Verify user permissions"""

        if not AUTH_SERVER_URL:
            logging.error("KEYCLOAK_INTERNAL_URL is not set")
            return False

        url = f"{AUTH_SERVER_URL}/realms/{realm_name}/protocol/openid-connect/token"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/x-www-form-urlencoded",
        }

        data = {
            "grant_type": "urn:ietf:params:oauth:grant-type:uma-ticket",
            "permission": permission,
            "audience": RESOURCE_SERVER_ID,
        }

        try:
            response = requests.post(url, headers=headers, data=data, timeout=10)

            if response.status_code == 200:
                payload = response.json()
                return "access_token" in payload

            return False

        except requests.RequestException as e:
            logging.error(f"Authorization request error: {e}")
            return False

        
    def _extract_realm_name(self, token_data: dict) -> str:

        iss = token_data.get("iss")

        if not iss or "/realms/" not in iss:
            raise HTTPException(status_code=401, detail="Invalid token: missing issuer")
        
        return iss.split("/realms/")[-1]


    def _has_org_manager_role(self, token_data: dict) -> bool:
        """Check realm-level roles for org-manager/realm-admin."""
        
        realm_roles = {r.upper() for r in token_data.get("realm_access", {}).get("roles", [])}
        target = {"ORG_MANAGER", "REALM_ADMIN", "REALM-ADMIN"}
        
        return bool(realm_roles & target)
