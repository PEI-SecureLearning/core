from collections.abc import Generator
from typing import Annotated
from urllib.parse import quote

from fastapi import Depends
from sqlmodel import Session

from src.core.db import engine
from src.services.compliance.token_helpers import (
    decode_token_verified,
    get_realm_from_iss,
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def get_current_realm(access_token: OAuth2Scheme) -> str:
    """Extract and verify the realm from the access token via JWKS."""
    claims = decode_token_verified(access_token)
    return get_realm_from_iss(claims.get("iss"))


def safe_realm(realm: str) -> str:
    """URL-encode the realm to prevent path-traversal in downstream URLs."""
    return quote(realm, safe="")


SessionDep = Annotated[Session, Depends(get_db)]
CurrentRealm = Annotated[str, Depends(get_current_realm)]
SafeRealm = Annotated[str, Depends(safe_realm)]
OAuth2Scheme = Annotated[str, Depends(oauth_2_scheme)]
