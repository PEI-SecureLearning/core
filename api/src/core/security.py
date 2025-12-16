import logging
import os
import jwt
import requests
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, Request

oauth_2_scheme = OAuth2PasswordBearer(tokenUrl="token")

AUTH_SERVER_URL = os.getenv("KEYCLOAK_URL")  # ex: http://keycloak:8080
RESOURCE_SERVER_ID = "api"


def _extract_realm_name(token_data: dict) -> str:
    iss = token_data.get("iss")
    if not iss or "/realms/" not in iss:
        raise HTTPException(status_code=401, detail="Invalid token: missing issuer")
    return iss.split("/realms/")[-1]


def _has_org_manager_role(token_data: dict) -> bool:
    """Check realm-level roles for org-manager/realm-admin."""
    realm_roles = {r.upper() for r in token_data.get("realm_access", {}).get("roles", [])}
    target = {"ORG_MANAGER", "REALM_ADMIN", "REALM-ADMIN"}
    return bool(realm_roles & target)


def check_keycloak_permission(
    access_token: str,
    permission: str,   # ex: "org_manager#view"
    realm_name: str,
) -> bool:
    if not AUTH_SERVER_URL:
        logging.error("KEYCLOAK_INTERNAL_URL is not set")
        return False

    url = f"{AUTH_SERVER_URL}/realms/{realm_name}/protocol/openid-connect/token"

    headers = {
        # CORREÇÃO: tem de ter "Bearer "
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    data = {
        "grant_type": "urn:ietf:params:oauth:grant-type:uma-ticket",
        # CORREÇÃO: "resource#scope" quando há scopes definidos no resource
        "permission": permission,
        "audience": RESOURCE_SERVER_ID,
    }

    try:
        response = requests.post(url, headers=headers, data=data, timeout=10)

        if response.status_code == 200:
            payload = response.json()
            return "access_token" in payload

        # Log detalhado para perceber 401/403/400
        logging.error(
            "Keycloak UMA denied. status=%s body=%s",
            response.status_code,
            response.text,
        )
        return False

    except requests.RequestException as e:
        logging.error(f"Authorization request error: {e}")
        return False


class valid_resource_access:
    """
    Usa UMA (uma-ticket) para validar permissões no Keycloak.

    Exemplo:
        Depends(valid_resource_access("org_manager", "view"))
        Depends(valid_resource_access("org_manager", "manage"))
    """

    def __init__(self, resource: str, scope: str):
        self.resource = resource
        self.scope = scope

    async def __call__(
        self,
        request: Request,
        access_token: str = Depends(oauth_2_scheme),
    ):
        # Allow pre-flight requests
        if request.method == "OPTIONS":
            return

        try:
            decoded = jwt.decode(
                access_token,
                options={"verify_signature": False, "verify_aud": False},
            )
        except Exception as e:
            logging.error(f"Failed to decode token: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")

        realm_name = _extract_realm_name(decoded)

        permission = f"{self.resource}#{self.scope}"

        # If org_manager role is present at realm level, accept without UMA
        if self.resource == "org_manager" and _has_org_manager_role(decoded):
            return {"authorized": True}

        if not check_keycloak_permission(access_token, permission, realm_name):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied for '{permission}'",
            )

        return {"authorized": True}
