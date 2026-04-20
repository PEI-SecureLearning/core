from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from src.core.dependencies import SessionDep, OAuth2Scheme, CurrentRealm
from src.core.security import Roles, Resource, Scope
from src.services.compliance.token_helpers import decode_token_verified
from src.services import progress as progress_service

router = APIRouter(prefix="/users", tags=["certificates"])


@router.get(
    "/me/certificates",
    responses={401: {"description": "Invalid token"}},
)
async def get_my_certificates(
    session: SessionDep,
    realm: CurrentRealm,
    token: OAuth2Scheme,
    include_expired: Annotated[bool, Query()] = False,
):
    """Get certificates for the authenticated user."""
    claims = decode_token_verified(token)
    user_id = claims.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    return await progress_service.list_certificates(
        user_id=user_id,
        session=session,
        realm_name=realm,
        include_expired=include_expired,
    )


@router.get(
    "/{user_id}/certificates",
    dependencies=[Depends(Roles(Resource.ORG_MANAGER, Scope.VIEW))],
    responses={401: {"description": "Invalid token"}},
)
async def get_user_certificates(
    user_id: str,
    session: SessionDep,
    realm: CurrentRealm,
    token: OAuth2Scheme,
    include_expired: Annotated[bool, Query()] = False,
):
    """Get certificates for a user (org manager only)."""
    return await progress_service.list_certificates(
        user_id=user_id,
        session=session,
        realm_name=realm,
        include_expired=include_expired,
    )
