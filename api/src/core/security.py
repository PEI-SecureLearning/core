import logging
import os
import jwt
import requests
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException
from typing import Annotated
from jwt import PyJWKClient

oauth_2_scheme = OAuth2PasswordBearer(tokenUrl="token")


AUTH_SERVER_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
RESOURCE_SERVER_ID = "api"


def check_keycloak_permission(access_token: str, resource: str, realm_name: str) -> bool:

    url = f"{AUTH_SERVER_URL}/realms/{realm_name}/protocol/openid-connect/token"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    data = {
        "grant_type": "urn:ietf:params:oauth:grant-type:uma-ticket",
        "permission": f"{resource}",
        "audience": RESOURCE_SERVER_ID,
    }

    try:
        response = requests.post(url, headers=headers, data=data)
        response.raise_for_status()

        if response.status_code == 200 and "access_token" in response.json():
            return True

        return False

    except requests.exceptions.HTTPError as e:
        logging.error(f"Keycloak authorization failed: {e}")
        return False
    except Exception as e:
        logging.error(f"Authorization request error: {e}")
        return False


class valid_resource_access:
    def __init__(self, resource: str):
        self.resource = resource

    async def __call__(self, access_token: str = Depends(oauth_2_scheme)):
        # Extract realm from token
        try:
            decoded = jwt.decode(
                access_token, options={"verify_signature": False, "verify_aud": False}
            )
            iss = decoded.get("iss")
            if iss:
                # Extract realm from issuer URL (e.g., http://localhost:8080/realms/my-realm)
                realm_name = iss.split("/realms/")[-1]
            else:
                raise HTTPException(status_code=401, detail="Invalid token: missing issuer")
        except Exception as e:
            logging.error(f"Failed to extract realm from token: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")

        # Check the authorization policy centrally in Keycloak
        if not check_keycloak_permission(access_token, self.resource, realm_name):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied for resource '{self.resource}'",
            )

        # Authorization successful!
        return {"authorized": True}

