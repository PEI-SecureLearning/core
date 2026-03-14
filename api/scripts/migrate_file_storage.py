from __future__ import annotations

import argparse
import asyncio
import base64

from bson import ObjectId

from src.core.mongo import (
    close_mongo_client,
    get_content_collection,
    get_content_gridfs_bucket,
    get_tenant_logos_collection,
)
from src.core.object_storage import (
    ObjectStorageError,
    build_object_key,
    ensure_bucket,
    put_bytes,
)
from src.core.settings import settings


async def migrate_content(*, dry_run: bool) -> tuple[int, int]:
    collection = get_content_collection()
    bucket = get_content_gridfs_bucket()
    migrated = 0
    skipped = 0

    cursor = collection.find({"kind": "content_piece", "file": {"$type": "object"}})
    async for doc in cursor:
        file_meta = doc.get("file") or {}
        storage = file_meta.get("storage")
        if storage == "garage":
            skipped += 1
            continue

        filename = file_meta.get("filename") or "uploaded-content"
        content_type = file_meta.get("content_type") or "application/octet-stream"
        content_piece_id = doc.get("content_piece_id")
        if not isinstance(content_piece_id, str) or not content_piece_id:
            skipped += 1
            continue

        raw: bytes | None = None
        if storage == "gridfs":
            gridfs_file_id = file_meta.get("gridfs_file_id")
            if not isinstance(gridfs_file_id, str) or not ObjectId.is_valid(gridfs_file_id):
                skipped += 1
                continue
            stream = await bucket.open_download_stream(ObjectId(gridfs_file_id))
            raw = await stream.read()
        else:
            data_base64 = file_meta.get("data_base64")
            if not isinstance(data_base64, str):
                skipped += 1
                continue
            raw = base64.b64decode(data_base64)

        object_key = build_object_key(settings.GARAGE_CONTENT_PREFIX, content_piece_id, filename)
        if not dry_run:
            etag = await put_bytes(
                bucket=settings.GARAGE_BUCKET_CONTENT,
                key=object_key,
                data=raw,
                content_type=content_type,
            )
            await collection.update_one(
                {"_id": doc["_id"]},
                {
                    "$set": {
                        "file.storage": "garage",
                        "file.object_key": object_key,
                        "file.etag": etag,
                        "file.gridfs_file_id": None,
                        "file.data_base64": None,
                    }
                },
            )
        migrated += 1

    return migrated, skipped


async def migrate_logos(*, dry_run: bool) -> tuple[int, int]:
    collection = get_tenant_logos_collection()
    migrated = 0
    skipped = 0

    cursor = collection.find({})
    async for doc in cursor:
        if doc.get("storage") == "garage":
            skipped += 1
            continue

        realm = doc.get("realm")
        data = doc.get("data")
        if not isinstance(realm, str) or not realm or not data:
            skipped += 1
            continue

        filename = doc.get("filename") or "logo"
        content_type = doc.get("content_type") or "application/octet-stream"
        object_key = build_object_key(settings.GARAGE_LOGOS_PREFIX, realm, filename)

        if not dry_run:
            etag = await put_bytes(
                bucket=settings.GARAGE_BUCKET_LOGOS,
                key=object_key,
                data=bytes(data),
                content_type=content_type,
            )
            await collection.update_one(
                {"_id": doc["_id"]},
                {
                    "$set": {
                        "storage": "garage",
                        "object_key": object_key,
                        "etag": etag,
                    },
                    "$unset": {"data": ""},
                },
            )
        migrated += 1

    return migrated, skipped


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Migrate Mongo file payloads to Garage object storage."
    )
    parser.add_argument("--dry-run", action="store_true", help="Scan and count without writing changes.")
    args = parser.parse_args()

    try:
        await ensure_bucket(settings.GARAGE_BUCKET_CONTENT)
        await ensure_bucket(settings.GARAGE_BUCKET_LOGOS)
        content_migrated, content_skipped = await migrate_content(dry_run=args.dry_run)
        logos_migrated, logos_skipped = await migrate_logos(dry_run=args.dry_run)
    except ObjectStorageError as exc:
        raise SystemExit(str(exc)) from exc
    finally:
        await close_mongo_client()

    mode = "dry-run" if args.dry_run else "write"
    print(
        f"[{mode}] content migrated={content_migrated} skipped={content_skipped} | "
        f"logos migrated={logos_migrated} skipped={logos_skipped}"
    )


if __name__ == "__main__":
    asyncio.run(main())
