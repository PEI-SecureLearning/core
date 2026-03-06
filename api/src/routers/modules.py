from fastapi import APIRouter, HTTPException, Query, status

from src.core.dependencies import CurrentRealm, OAuth2Scheme
from src.models.module import (
    ModuleCreate,
    ModuleOut,
    ModulePatch,
    ModuleStatus,
    ModuleUpdate,
    PaginatedModules,
)
from src.services import modules as module_service
from src.services.compliance.token_helpers import decode_token_verified

router = APIRouter()


def _get_sub(token: str) -> str:
    """Extract the Keycloak `sub` claim from the bearer token (already verified)."""
    claims = decode_token_verified(token)
    sub = claims.get("sub", "")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing 'sub' claim",
        )
    return sub


@router.get(
    "/modules",
    response_model=PaginatedModules,
    summary="List modules",
    description=(
        "Returns a paginated list of modules belonging to the caller's realm. "
        "Sections and blocks are **excluded** from list results to keep payloads small; "
        "fetch a single module to get its full content."
    ),
)
async def list_modules(
    realm: CurrentRealm,
    status_filter: ModuleStatus | None = Query(None, alias="status"),
    search: str | None = Query(None, description="Case-insensitive substring filter on title or category"),
    sort:   str | None = Query(None, description="Sort order: title_asc | title_desc | newest | oldest"),
    page:  int = Query(1,  ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> PaginatedModules:
    return await module_service.list_modules(
        realm=realm,
        status_filter=status_filter,
        search=search,
        sort=sort,
        page=page,
        limit=limit,
    )


@router.get(
    "/modules/{module_id}",
    response_model=ModuleOut,
    summary="Get a module",
    description="Returns the full module document including all sections and blocks.",
)
async def get_module(module_id: str, realm: CurrentRealm) -> ModuleOut:
    module = await module_service.get_module(module_id)
    if not module or (getattr(module, "realm", None) and module.realm != realm):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )
    return module


@router.post(
    "/modules",
    response_model=ModuleOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a module",
    description=(
        "Creates a new module in **draft** status. "
        "The caller's realm and Keycloak `sub` are attached automatically."
    ),
)
async def create_module(
    payload: ModuleCreate,
    realm:   CurrentRealm,
    token:   OAuth2Scheme,
) -> ModuleOut:
    created_by = _get_sub(token)
    return await module_service.create_module(
        payload=payload,
        realm=realm,
        created_by=created_by,
    )


@router.put(
    "/modules/{module_id}",
    response_model=ModuleOut,
    summary="Full update",
    description=(
        "Replaces all editable fields in the module. "
        "Increments the `version` counter for optimistic concurrency."
    ),
)
async def update_module(
    module_id: str,
    payload:   ModuleUpdate,
    realm:     CurrentRealm,
) -> ModuleOut:
    return await module_service.update_module(
        module_id=module_id,
        payload=payload,
        realm=realm,
    )


@router.patch(
    "/modules/{module_id}",
    response_model=ModuleOut,
    summary="Partial update (auto-save)",
    description=(
        "Updates only the fields supplied in the request body. "
        "This is the endpoint the frontend debounced auto-save hits. "
        "Fields not present in the body are **not** changed."
    ),
)
async def patch_module(
    module_id: str,
    payload:   ModulePatch,
    realm:     CurrentRealm,
) -> ModuleOut:
    return await module_service.patch_module(
        module_id=module_id,
        payload=payload,
        realm=realm,
    )


@router.post(
    "/modules/{module_id}/publish",
    response_model=ModuleOut,
    summary="Publish a module",
    description="Transitions the module from `draft` to `published`.",
)
async def publish_module(module_id: str, realm: CurrentRealm) -> ModuleOut:
    return await module_service.publish_module(module_id=module_id, realm=realm)


@router.post(
    "/modules/{module_id}/archive",
    response_model=ModuleOut,
    summary="Archive a module",
    description="Transitions the module to `archived` status.",
)
async def archive_module(module_id: str, realm: CurrentRealm) -> ModuleOut:
    return await module_service.archive_module(module_id=module_id, realm=realm)


@router.delete(
    "/modules/{module_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a module",
    description="Hard-deletes a draft or archived module. Published modules must be archived first.",
)
async def delete_module(module_id: str, realm: CurrentRealm) -> None:
    await module_service.delete_module(module_id=module_id, realm=realm)
