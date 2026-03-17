import logging
import os
import traceback
from enum import StrEnum

import jwt
from jwt import PyJWKClient
import requests
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, Request
from typing import Annotated
import httpx


oauth_2_scheme = OAuth2PasswordBearer(tokenUrl="token")

AUTH_SERVER_URL = os.getenv("KEYCLOAK_URL")
KEYCLOAK_ISSUER_URL = os.getenv("KEYCLOAK_ISSUER_URL", AUTH_SERVER_URL)
RESOURCE_SERVER_ID = "api"



class Resource(StrEnum):
    """Keycloak UMA resource names used in permission checks."""
    ADMIN           = "admin"
    ORG_MANAGER     = "org_manager"
    CONTENT_MANAGER = "content-manager"


class Scope(StrEnum):
    """Keycloak UMA scope names used in permission checks."""
    VIEW   = "view"
    MANAGE = "manage"


class Roles:

    """
    Uses UMA (uma-ticket) to validate permissions in Keycloak.
    """

    def __init__(self, resource: str | list[str], scope: str):
        self.resources = [resource] if isinstance(resource, str) else resource
        self.scope = scope

    def _get_jwks_client(self, realm_name: str) -> PyJWKClient:
        url = f"{AUTH_SERVER_URL}/realms/{realm_name}/protocol/openid-connect/certs"
        return PyJWKClient(url)
    

    def _verify_token(self, access_token: str, realm_name: str) -> dict:
        jwks_client = self._get_jwks_client(realm_name)
        signing_key = jwks_client.get_signing_key_from_jwt(access_token)
        
        try:
            jwt.decode(
                access_token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False}, 
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError as e:
            logging.error(f"Token verification failed: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")


    async def __call__(self, request: Request, access_token: Annotated[str, Depends(oauth_2_scheme)]):
        try:
            decoded = jwt.decode(
                access_token,
                options={"verify_signature": False, "verify_aud": False},
            )
            print(decoded)
        except Exception as e:
            logging.error(f"Failed to decode token: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")

        realm_name = self._extract_realm_name(decoded)

        self._verify_token(access_token, realm_name)

        authorized = False
        last_permission = ""
        for resource in self.resources:
            permission = f"{resource}#{self.scope}"
            last_permission = permission
            if await self.check_keycloak_permission(access_token, permission, realm_name):
                authorized = True
                break

        if not authorized:
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied for '{' or '.join(self.resources)}#{self.scope}'" if len(self.resources) > 1 else f"Permission denied for '{last_permission}'",
            )

        return {"authorized": True}


    async def check_keycloak_permission(self, access_token: str, permission: str, realm_name: str) -> bool:
        """Verify user permissions"""

        if not KEYCLOAK_ISSUER_URL:
            logging.error("KEYCLOAK_ISSUER_URL is not set")
            return False

        url = f"{KEYCLOAK_ISSUER_URL}/realms/{realm_name}/protocol/openid-connect/token"

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
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, data=data, timeout=10)

            if response.status_code == 200:
                payload = response.json()
                return "access_token" in payload

            if response.status_code in [400, 403]:
                return False

            logging.error(f"Keycloak error {response.status_code}: {response.text}")
            raise HTTPException(status_code=response.status_code, detail="Authorization server error")

        except httpx.RequestError as e:
            logging.error(f"Authorization request error: {e}")
            raise HTTPException(status_code=503, detail="Authorization server unavailable")

        
    def _extract_realm_name(self, token_data: dict) -> str:

        iss = token_data.get("iss")

        if not iss or "/realms/" not in iss:
            raise HTTPException(status_code=401, detail="Invalid token: missing issuer")
        
        return iss.split("/realms/")[-1]
