import logging
import os
import traceback
import jwt
from jwt import PyJWKClient
import requests
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, Request
from typing import Annotated
import httpx


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
        except Exception as e:
            logging.error(f"Failed to decode token: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")

        realm_name = self._extract_realm_name(decoded)

        self._verify_token(access_token, realm_name)

        permission = f"{self.resource}#{self.scope}"

        if not await self.check_keycloak_permission(access_token, permission, realm_name):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied for '{permission}'",
            )

        return {"authorized": True}


    async def check_keycloak_permission(self, access_token: str, permission: str, realm_name: str) -> bool:
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
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, data=data, timeout=10)

            if response.status_code == 200:
                payload = response.json()
                return "access_token" in payload

            raise HTTPException(status_code=response.status_code, detail="Authorization server error")

        except httpx.RequestError as e:
            logging.error(f"Authorization request error: {e}")
            raise HTTPException(status_code=503, detail="Authorization server unavailable")

        
    def _extract_realm_name(self, token_data: dict) -> str:

        iss = token_data.get("iss")

        if not iss or "/realms/" not in iss:
            raise HTTPException(status_code=401, detail="Invalid token: missing issuer")
        
        return iss.split("/realms/")[-1]

