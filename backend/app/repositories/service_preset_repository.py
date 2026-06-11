from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service_preset import ServicePreset


class ServicePresetRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, workshop_id: str, **fields: object) -> ServicePreset:
        preset = ServicePreset(workshop_id=workshop_id, **fields)
        self._session.add(preset)
        await self._session.flush()
        return preset

    async def list_by_workshop(self, workshop_id: str) -> list[ServicePreset]:
        result = await self._session.execute(
            select(ServicePreset)
            .where(ServicePreset.workshop_id == workshop_id)
            .order_by(ServicePreset.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, preset_id: str, workshop_id: str) -> ServicePreset | None:
        result = await self._session.execute(
            select(ServicePreset).where(
                ServicePreset.id == preset_id,
                ServicePreset.workshop_id == workshop_id,
            )
        )
        return result.scalar_one_or_none()

    async def delete(self, preset_id: str, workshop_id: str) -> bool:
        result = await self._session.execute(
            delete(ServicePreset).where(
                ServicePreset.id == preset_id,
                ServicePreset.workshop_id == workshop_id,
            )
        )
        return result.rowcount > 0
