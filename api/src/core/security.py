import logging
import os
from enum import StrEnum
from typing import Annotated

import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer


from src.core.settings import settings


oauth_2_scheme = OAuth2PasswordBearer(tokenUrl="token")

AUTH_SERVER_URL = settings.KEYCLOAK_URL
KEYCLOAK_ISSUER_URL = settings.KEYCLOAK_ISSUER_URL or AUTH_SERVER_URL
RESOURCE_SERVER_ID = "api"
_JWKS_CLIENTS: dict[str, PyJWKClient] = {}


class Resource(StrEnum):
    ADMIN = "admin"
    ORG_MANAGER = "org_manager"
    CONTENT_MANAGER = "content_manager"


class Scope(StrEnum):
    VIEW = "view"
    MANAGE = "manage"


class Roles:
    """
    Validates the JWT locally and checks roles from the token payload.
    """

    def __init__(self, resource: str | list[str], scope: str):
        self.resources = [resource] if isinstance(resource, str) else resource
        self.scope = scope

    def _get_jwks_client(self, realm_name: str) -> PyJWKClient:
        if not AUTH_SERVER_URL:
            raise HTTPException(
                status_code=500,
                detail="Authentication server not configured",
            )

        if realm_name in _JWKS_CLIENTS:
            return _JWKS_CLIENTS[realm_name]

        url = f"{AUTH_SERVER_URL}/realms/{realm_name}/protocol/openid-connect/certs"
        jwks_client = PyJWKClient(url)
        _JWKS_CLIENTS[realm_name] = jwks_client
        return jwks_client

    def _extract_realm_name(self, token_data: dict) -> str:
        iss = token_data.get("iss")

        if not iss or "/realms/" not in iss:
            raise HTTPException(status_code=401, detail="Invalid token: missing issuer")

        return iss.split("/realms/")[-1].split("/")[0]

    def _verify_token(self, access_token: str, realm_name: str) -> dict:
        jwks_client = self._get_jwks_client(realm_name)
        issuer = f"{KEYCLOAK_ISSUER_URL}/realms/{realm_name}"

        try:
            signing_key = jwks_client.get_signing_key_from_jwt(access_token)
            return jwt.decode(
                access_token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=issuer,
                audience=RESOURCE_SERVER_ID,
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidAudienceError as e:
            logging.error(f"Invalid audience: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")
        except jwt.InvalidIssuerError as e:
            logging.error(f"Invalid issuer: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")
        except jwt.InvalidTokenError as e:
            logging.error(f"Token verification failed: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            logging.error(f"Unexpected token verification error: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")

    def _get_required_roles(self) -> set[str]:
        permission_map = {
            (Resource.ADMIN.value, Scope.VIEW.value): {"admin"},
            (Resource.ADMIN.value, Scope.MANAGE.value): {"admin"},
            (Resource.ORG_MANAGER.value, Scope.VIEW.value): {"org_manager"},
            (Resource.ORG_MANAGER.value, Scope.MANAGE.value): {"org_manager"},
            (Resource.CONTENT_MANAGER.value, Scope.VIEW.value): {"content_manager"},
            (Resource.CONTENT_MANAGER.value, Scope.MANAGE.value): {"content_manager"},
        }

        required_roles: set[str] = set()
        for resource in self.resources:
            required_roles.update(
                {role.lower() for role in permission_map.get((resource, self.scope), set())}
            )
        return required_roles

    def _extract_roles(self, payload: dict) -> set[str]:
        realm_access = payload.get("realm_access") or {}
        token_roles = realm_access.get("roles") or []
        return {str(role).strip().lower() for role in token_roles if str(role).strip()}

    async def __call__(
        self,
        request: Request,
        access_token: Annotated[str, Depends(oauth_2_scheme)],
    ):
        try:
            unverified_payload = jwt.decode(
                access_token,
                options={"verify_signature": False, "verify_aud": False},
            )
        except Exception as e:
            logging.error(f"Failed to decode token: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")

        realm_name = self._extract_realm_name(unverified_payload)
        payload = self._verify_token(access_token, realm_name)

        token_roles = self._extract_roles(payload)
        required_roles = self._get_required_roles()

        if required_roles.isdisjoint(token_roles):
            permission_label = f"{' or '.join(self.resources)}#{self.scope}"
            logging.error(f"403 ERROR: Token Roles: {token_roles}, Required: {required_roles}, Payload realm_access: {payload.get('realm_access')} resource_access: {payload.get('resource_access')}")
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied for '{permission_label}'",
            )

        return {"authorized": True}
