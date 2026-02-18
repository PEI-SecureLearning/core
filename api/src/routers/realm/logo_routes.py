"""Tenant logo upload and retrieval routes."""

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import StreamingResponse

from src.core.dependencies import SafeRealm, OAuth2Scheme
from src.services.platform_admin import get_platform_admin_service

realm_service = get_platform_admin_service()

router = APIRouter()

ALLOWED_LOGO_TYPES = {"image/png", "image/jpeg", "image/svg+xml"}
MAX_LOGO_BYTES = 2 * 1024 * 1024


@router.post(
    "/realms/{realm}/logo", 
    status_code=status.HTTP_201_CREATED,
    responses={400: {"description": "Invalid logo file"}},
)
async def upload_realm_logo(
    realm: SafeRealm,
    token: OAuth2Scheme,
    file: UploadFile = File(...),
):
    if file.content_type not in ALLOWED_LOGO_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid logo type. Use PNG, JPG, or SVG.",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Logo file is empty.")
    if len(data) > MAX_LOGO_BYTES:
        raise HTTPException(status_code=400, detail="Logo exceeds 2MB limit.")

    logo_id = await realm_service.upsert_tenant_logo(
        realm_name=realm,
        data=data,
        content_type=file.content_type,
        filename=file.filename,
    )
    return {"id": logo_id}


@router.get(
    "/realms/{realm}/logo",
    responses={404: {"description": "Tenant logo not found"}},
)
async def get_realm_logo(realm: SafeRealm):
    doc = await realm_service.get_tenant_logo(realm)
    if not doc or not doc.get("data"):
        raise HTTPException(status_code=404, detail="Tenant logo not found")

    content_type = doc.get("content_type") or "application/octet-stream"
    data = bytes(doc.get("data"))
    return StreamingResponse(iter([data]), media_type=content_type)
