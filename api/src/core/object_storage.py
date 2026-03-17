from __future__ import annotations

import asyncio
from dataclasses import dataclass
from io import BytesIO
from typing import BinaryIO

import boto3
from botocore.client import BaseClient
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from src.core.settings import settings


class ObjectStorageError(RuntimeError):
    """Raised when Garage object storage operations fail."""


@dataclass(slots=True)
class StoredObject:
    stream: BinaryIO
    content_type: str
    size: int | None
    etag: str | None = None


_client: BaseClient | None = None
_public_client: BaseClient | None = None


def garage_enabled() -> bool:
    return settings.FILE_STORAGE_BACKEND.lower() == "garage"


def _build_client(endpoint_url: str) -> BaseClient:
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        region_name=settings.GARAGE_S3_REGION,
        aws_access_key_id=settings.GARAGE_ACCESS_KEY_ID,
        aws_secret_access_key=settings.GARAGE_SECRET_ACCESS_KEY,
        config=Config(
            s3={"addressing_style": "path" if settings.GARAGE_FORCE_PATH_STYLE else "auto"},
            signature_version="s3v4",
        ),
    )


def _get_client() -> BaseClient:
    global _client
    if _client is None:
        _client = _build_client(settings.GARAGE_S3_ENDPOINT)
    return _client


def _get_public_client() -> BaseClient:
    global _public_client
    if _public_client is None:
        _public_client = _build_client(settings.GARAGE_S3_PUBLIC_ENDPOINT)
    return _public_client


def _normalize_prefix(prefix: str) -> str:
    cleaned = prefix.strip().strip("/")
    return f"{cleaned}/" if cleaned else ""


def _expected_bucket_owner() -> str | None:
    owner = settings.GARAGE_EXPECTED_BUCKET_OWNER.strip()
    return owner or None


def build_object_key(prefix: str, object_id: str, filename: str | None = None) -> str:
    base = _normalize_prefix(prefix)
    safe_name = (filename or "").strip().replace("\\", "/").split("/")[-1]
    return f"{base}{object_id}/{safe_name}" if safe_name else f"{base}{object_id}"


async def ensure_bucket(bucket: str) -> None:
    if not bucket:
        raise ObjectStorageError("Garage bucket is not configured")

    client = _get_client()

    def _ensure() -> None:
        try:
            head_args = {"Bucket": bucket}
            expected_owner = _expected_bucket_owner()
            if expected_owner:
                head_args["ExpectedBucketOwner"] = expected_owner
            client.head_bucket(**head_args)
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code")
            if error_code not in {"404", "NoSuchBucket"}:
                raise
            create_args = {"Bucket": bucket}
            if settings.GARAGE_S3_REGION and settings.GARAGE_S3_REGION != "us-east-1":
                create_args["CreateBucketConfiguration"] = {
                    "LocationConstraint": settings.GARAGE_S3_REGION
                }
            client.create_bucket(**create_args)

    try:
        await asyncio.to_thread(_ensure)
    except (ClientError, BotoCoreError) as exc:
        raise ObjectStorageError(f"Failed to ensure Garage bucket '{bucket}': {exc}") from exc


async def put_bytes(
    *,
    bucket: str,
    key: str,
    data: bytes,
    content_type: str,
) -> str | None:
    client = _get_client()

    def _put() -> str | None:
        put_args = {
            "Bucket": bucket,
            "Key": key,
            "Body": data,
            "ContentType": content_type,
        }
        expected_owner = _expected_bucket_owner()
        if expected_owner:
            put_args["ExpectedBucketOwner"] = expected_owner
        response = client.put_object(
            **put_args,
        )
        etag = response.get("ETag")
        return etag.strip('"') if isinstance(etag, str) else None

    try:
        return await asyncio.to_thread(_put)
    except (ClientError, BotoCoreError) as exc:
        raise ObjectStorageError(
            f"Failed to store object '{key}' in Garage bucket '{bucket}': {exc}"
        ) from exc


async def get_object(*, bucket: str, key: str) -> StoredObject:
    client = _get_client()

    def _get() -> StoredObject:
        get_args = {"Bucket": bucket, "Key": key}
        expected_owner = _expected_bucket_owner()
        if expected_owner:
            get_args["ExpectedBucketOwner"] = expected_owner
        response = client.get_object(**get_args)
        raw = response["Body"].read()
        return StoredObject(
            stream=BytesIO(raw),
            content_type=response.get("ContentType") or "application/octet-stream",
            size=response.get("ContentLength"),
            etag=(response.get("ETag") or "").strip('"') or None,
        )

    try:
        return await asyncio.to_thread(_get)
    except (ClientError, BotoCoreError) as exc:
        raise ObjectStorageError(
            f"Failed to fetch object '{key}' from Garage bucket '{bucket}': {exc}"
        ) from exc


async def delete_object(*, bucket: str, key: str) -> None:
    client = _get_client()

    def _delete() -> None:
        delete_args = {"Bucket": bucket, "Key": key}
        expected_owner = _expected_bucket_owner()
        if expected_owner:
            delete_args["ExpectedBucketOwner"] = expected_owner
        client.delete_object(**delete_args)

    try:
        await asyncio.to_thread(_delete)
    except (ClientError, BotoCoreError) as exc:
        raise ObjectStorageError(
            f"Failed to delete object '{key}' from Garage bucket '{bucket}': {exc}"
        ) from exc


def generate_presigned_get_url(*, bucket: str, key: str, expires_in: int | None = None) -> str:
    client = _get_public_client()
    ttl = expires_in or settings.GARAGE_PRESIGNED_URL_TTL_SECONDS
    try:
        params = {"Bucket": bucket, "Key": key}
        expected_owner = _expected_bucket_owner()
        if expected_owner:
            params["ExpectedBucketOwner"] = expected_owner
        return client.generate_presigned_url(
            "get_object",
            Params=params,
            ExpiresIn=ttl,
        )
    except (ClientError, BotoCoreError) as exc:
        raise ObjectStorageError(
            f"Failed to generate presigned URL for '{key}' in Garage bucket '{bucket}': {exc}"
        ) from exc
