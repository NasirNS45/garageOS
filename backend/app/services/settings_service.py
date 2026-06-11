import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.workshop_repository import WorkshopRepository
from app.schemas.settings import WorkshopSettingsResponse, WorkshopSettingsUpdate

logger = logging.getLogger(__name__)


class SettingsService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = WorkshopRepository(session)

    async def get(self, workshop_id: str) -> WorkshopSettingsResponse:
        workshop = await self._repo.get_by_id(workshop_id)
        if workshop is None:
            raise NotFoundError("Workshop not found")
        return WorkshopSettingsResponse.model_validate(workshop)

    async def update(
        self, workshop_id: str, payload: WorkshopSettingsUpdate
    ) -> WorkshopSettingsResponse:
        fields = payload.model_dump(exclude_none=True)
        workshop = await self._repo.update(workshop_id, **fields)
        if workshop is None:
            raise NotFoundError("Workshop not found")
        logger.info("Workshop settings updated", extra={"workshop_id": workshop_id})
        return WorkshopSettingsResponse.model_validate(workshop)
