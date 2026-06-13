import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException, NotFoundError
from app.repositories.job_card_repository import JobCardRepository
from app.repositories.photo_repository import PhotoRepository
from app.schemas.photo import (
    PhotoCreate,
    PhotoPresignResponse,
    PhotoResponse,
)
from app.services.storage_service import StorageService

logger = logging.getLogger(__name__)

_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


class StorageNotConfiguredError(AppException):
    status_code = 503
    detail = "Photo storage is not configured"
    code = "storage_unavailable"


class PhotoService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = PhotoRepository(session)
        self._cards = JobCardRepository(session)
        self._storage = StorageService()

    async def _ensure_card(self, workshop_id: str, job_card_id: str) -> None:
        card = await self._cards.get_by_id(job_card_id, workshop_id)
        if card is None:
            raise NotFoundError("Job card not found")

    async def presign(
        self, workshop_id: str, job_card_id: str, content_type: str
    ) -> PhotoPresignResponse:
        if not self._storage.enabled:
            raise StorageNotConfiguredError()
        await self._ensure_card(workshop_id, job_card_id)
        ext = _EXT[content_type]
        object_key = f"workshops/{workshop_id}/jobs/{job_card_id}/{uuid.uuid4().hex}.{ext}"
        return PhotoPresignResponse(
            upload_url=self._storage.presigned_put(object_key, content_type),
            object_key=object_key,
            public_url=self._storage.public_url(object_key),
        )

    async def create(
        self, workshop_id: str, job_card_id: str, payload: PhotoCreate
    ) -> PhotoResponse:
        await self._ensure_card(workshop_id, job_card_id)
        photo = await self._repo.create(
            workshop_id=workshop_id,
            job_card_id=job_card_id,
            object_key=payload.object_key,
            url=payload.public_url,
            caption=payload.caption,
        )
        return PhotoResponse.model_validate(photo)

    async def list_for_job(self, workshop_id: str, job_card_id: str) -> list[PhotoResponse]:
        await self._ensure_card(workshop_id, job_card_id)
        rows = await self._repo.list_by_job(job_card_id)
        return [PhotoResponse.model_validate(p) for p in rows]

    async def delete(self, workshop_id: str, photo_id: str) -> None:
        photo = await self._repo.get_by_id(photo_id, workshop_id)
        if photo is None:
            raise NotFoundError("Photo not found")
        object_key = photo.object_key
        await self._repo.delete(photo)
        if self._storage.enabled:
            self._storage.delete(object_key)
