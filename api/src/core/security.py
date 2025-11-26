import logging
import jwt
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException
from typing import Annotated
from jwt import PyJWKClient

oauth_2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class valid_access_token:
    def __init__(self, role: str = None):
        self.role = role

    async def __call__(self, access_token: Annotated[str, Depends(oauth_2_scheme)]):
        url = "http://localhost:8080/realms/SecureLearning/protocol/openid-connect/certs"
        optional_custom_headers = {"User-agent": "custom-user-agent"}
        jwks_client = PyJWKClient(url, headers=optional_custom_headers)

        try:
            signing_key = jwks_client.get_signing_key_from_jwt(access_token)
            data = jwt.decode(
                access_token,
                signing_key.key,
                algorithms=["RS256"],
                audience="react-client",
                options={"verify_exp": True},
            )
            logging.info(data)
            
            if self.role and self.role not in data.get("realm_access", {}).get("roles", []):
                raise HTTPException(status_code=401, detail="Not authenticated")
            return data
        except jwt.exceptions.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Not authenticated")