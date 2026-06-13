import logging
from functools import lru_cache

import boto3
from botocore.client import Config

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_PRESIGN_EXPIRY = 300  # seconds the upload URL stays valid


@lru_cache
def _client() -> object:
    settings = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=settings.storage_endpoint_url,
        aws_access_key_id=settings.storage_access_key,
        aws_secret_access_key=settings.storage_secret_key,
        region_name=settings.storage_region,
        config=Config(signature_version="s3v4"),
    )


class StorageService:
    """S3-compatible object storage (Cloudflare R2). No-ops if not configured."""

    @property
    def enabled(self) -> bool:
        return get_settings().storage_enabled

    def public_url(self, object_key: str) -> str:
        base = get_settings().storage_public_url.rstrip("/")
        return f"{base}/{object_key}"

    def presigned_put(self, object_key: str, content_type: str) -> str:
        """A short-lived URL the client uses to PUT the file directly to storage."""
        settings = get_settings()
        return _client().generate_presigned_url(  # type: ignore[attr-defined]
            "put_object",
            Params={
                "Bucket": settings.storage_bucket,
                "Key": object_key,
                "ContentType": content_type,
            },
            ExpiresIn=_PRESIGN_EXPIRY,
        )

    def delete(self, object_key: str) -> None:
        settings = get_settings()
        try:
            _client().delete_object(  # type: ignore[attr-defined]
                Bucket=settings.storage_bucket, Key=object_key
            )
        except Exception as exc:  # noqa: BLE001 - storage cleanup is best-effort
            logger.warning(
                "Failed to delete storage object",
                extra={"object_key": object_key, "error": str(exc)},
            )
