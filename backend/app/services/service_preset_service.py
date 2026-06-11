import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.service_preset_repository import ServicePresetRepository
from app.schemas.service_preset import ServicePresetCreate, ServicePresetResponse

logger = logging.getLogger(__name__)


class ServicePresetService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = ServicePresetRepository(session)

    async def create(
        self, workshop_id: str, payload: ServicePresetCreate
    ) -> ServicePresetResponse:
        preset = await self._repo.create(
            workshop_id=workshop_id,
            name=payload.name.strip(),
            description=payload.description,
            default_labour=payload.default_labour,
        )
        logger.info("Service preset created", extra={"preset_id": preset.id})
        return ServicePresetResponse.model_validate(preset)

    async def list_presets(self, workshop_id: str) -> list[ServicePresetResponse]:
        presets = await self._repo.list_by_workshop(workshop_id)
        return [ServicePresetResponse.model_validate(p) for p in presets]

    async def delete(self, workshop_id: str, preset_id: str) -> None:
        deleted = await self._repo.delete(preset_id, workshop_id)
        if not deleted:
            raise NotFoundError("Service preset not found")
        logger.info("Service preset deleted", extra={"preset_id": preset_id})
