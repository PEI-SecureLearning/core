from datetime import datetime, timezone
from fastapi import HTTPException
from bson import Binary, ObjectId

from src.core.mongo import get_tenant_logos_collection


class logo_handler:

    async def upsert_tenant_logo(
        self,
        realm_name: str,
        data: bytes,
        content_type: str,
        filename: str | None = None,
    ) -> str:
        collection = get_tenant_logos_collection()
        now = datetime.now(timezone.utc)
        payload = {
            "realm": realm_name,
            "filename": filename,
            "content_type": content_type,
            "size": len(data),
            "data": Binary(data),
            "updated_at": now,
        }
        await collection.update_one(
            {"realm": realm_name},
            {
                "$set": payload,
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
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
