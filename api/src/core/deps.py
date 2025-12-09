from collections.abc import Generator
from typing import Annotated
import jwt
from fastapi import Depends, HTTPException
from sqlmodel import Session

from src.core.db import engine
from src.core.security import oauth_2_scheme


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def get_current_realm(access_token: str = Depends(oauth_2_scheme)) -> str:
    """Extract the realm from the access token."""
    try:
        decoded = jwt.decode(
            access_token, options={"verify_signature": False, "verify_aud": False}
        )
        iss = decoded.get("iss")
        if not iss:
            raise HTTPException(status_code=401, detail="Invalid token: missing issuer")

        parts = iss.split("/realms/")
        if len(parts) < 2:
            raise HTTPException(
                status_code=401, detail="Invalid token: cannot extract realm"
            )

        return parts[1]
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")


SessionDep = Annotated[Session, Depends(get_db)]
CurrentRealm = Annotated[str, Depends(get_current_realm)]
