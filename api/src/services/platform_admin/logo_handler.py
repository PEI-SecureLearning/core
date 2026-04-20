from datetime import datetime, timezone
from fastapi import HTTPException
from bson import ObjectId

from src.core.mongo import get_tenant_logos_collection
from src.core.object_storage import (
    ObjectStorageError,
    build_object_key,
    delete_object,
    ensure_bucket,
    get_object,
    put_bytes,
)
from src.core.settings import settings
from src.services.platform_admin.base_handler import base_handler


class logo_handler(base_handler):

    def __init__(self):
        super().__init__()

    async def upsert_tenant_logo(
        self,
        realm_name: str,
        data: bytes,
        content_type: str,
        filename: str | None = None,
    ) -> str:
        collection = get_tenant_logos_collection()
        now = datetime.now(timezone.utc)
        existing = await collection.find_one({"realm": realm_name})
        object_key = build_object_key(
            settings.GARAGE_LOGOS_PREFIX,
            realm_name,
            filename or "logo",
        )

        try:
            await ensure_bucket(settings.GARAGE_BUCKET_LOGOS)
            etag = await put_bytes(
                bucket=settings.GARAGE_BUCKET_LOGOS,
                key=object_key,
                data=data,
                content_type=content_type,
            )
        except ObjectStorageError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

        payload = {
            "realm": realm_name,
            "filename": filename,
            "content_type": content_type,
            "size": len(data),
            "storage": "garage",
            "object_key": object_key,
            "etag": etag,
            "updated_at": now,
        }
        try:
            await collection.update_one(
                {"realm": realm_name},
                {
                    "$set": payload,
                    "$unset": {"data": ""},
                    "$setOnInsert": {"created_at": now},
                },
                upsert=True,
            )
        except Exception:
            try:
                await delete_object(bucket=settings.GARAGE_BUCKET_LOGOS, key=object_key)
            except ObjectStorageError:
                pass
            raise

        if existing and existing.get("storage") == "garage":
            previous_key = existing.get("object_key")
            if (
                isinstance(previous_key, str)
                and previous_key
                and previous_key != object_key
            ):
                try:
                    await delete_object(
                        bucket=settings.GARAGE_BUCKET_LOGOS, key=previous_key
                    )
                except ObjectStorageError:
                    pass

        doc = await collection.find_one({"realm": realm_name})
        if not doc or not doc.get("_id"):
            raise HTTPException(status_code=500, detail="Failed to store tenant logo")

        logo_id = str(doc["_id"])
        self.admin.update_realm_attributes(
            realm_name,
            {
                "tenant-logo-id": logo_id,
                "tenant-logo-updated-at": now.isoformat(),
            },
        )
        return logo_id

    async def get_tenant_logo(self, realm_name: str) -> dict | None:
        collection = get_tenant_logos_collection()
        logo_id = self._get_realm_attribute(realm_name, "tenant-logo-id")

        doc = None
        if logo_id:
            try:
                doc = await collection.find_one({"_id": ObjectId(logo_id)})
            except Exception:
                doc = None

        if not doc:
            doc = await collection.find_one({"realm": realm_name})

        return doc

    async def get_tenant_logo_bytes(self, realm_name: str) -> tuple[bytes, str]:
        doc = await self.get_tenant_logo(realm_name)
        if not doc:
            raise HTTPException(status_code=404, detail="Tenant logo not found")

        content_type = doc.get("content_type") or "application/octet-stream"
        storage = doc.get("storage")
        if storage == "garage":
            object_key = doc.get("object_key")
            if not isinstance(object_key, str) or not object_key:
                raise HTTPException(status_code=404, detail="Tenant logo not found")
            try:
                stored = await get_object(
                    bucket=settings.GARAGE_BUCKET_LOGOS, key=object_key
                )
            except ObjectStorageError as exc:
                raise HTTPException(status_code=503, detail=str(exc)) from exc
            return stored.stream.read(), content_type

        data = doc.get("data")
        if not data:
            raise HTTPException(status_code=404, detail="Tenant logo not found")
        return bytes(data), content_type


_instance: logo_handler | None = None


def get_logo_handler() -> logo_handler:
    global _instance
    if _instance is None:
        _instance = logo_handler()
    return _instance
