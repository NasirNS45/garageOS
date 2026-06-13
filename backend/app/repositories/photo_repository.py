from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_photo import JobPhoto


class PhotoRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, workshop_id: str, **fields: object) -> JobPhoto:
        photo = JobPhoto(workshop_id=workshop_id, **fields)
        self._session.add(photo)
        await self._session.flush()
        return photo

    async def get_by_id(self, photo_id: str, workshop_id: str) -> JobPhoto | None:
        result = await self._session.execute(
            select(JobPhoto).where(
                JobPhoto.id == photo_id,
                JobPhoto.workshop_id == workshop_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_job(self, job_card_id: str) -> list[JobPhoto]:
        result = await self._session.execute(
            select(JobPhoto)
            .where(JobPhoto.job_card_id == job_card_id)
            .order_by(JobPhoto.created_at.asc())
        )
        return list(result.scalars().all())

    async def delete(self, photo: JobPhoto) -> None:
        await self._session.delete(photo)
        await self._session.flush()
