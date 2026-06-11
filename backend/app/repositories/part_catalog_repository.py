from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.part_catalog import PartCatalogItem


class PartCatalogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, workshop_id: str, **fields: object) -> PartCatalogItem:
        item = PartCatalogItem(workshop_id=workshop_id, **fields)
        self._session.add(item)
        await self._session.flush()
        return item

    async def list_by_workshop(self, workshop_id: str) -> list[PartCatalogItem]:
        result = await self._session.execute(
            select(PartCatalogItem)
            .where(PartCatalogItem.workshop_id == workshop_id)
            .order_by(PartCatalogItem.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, item_id: str, workshop_id: str) -> PartCatalogItem | None:
        result = await self._session.execute(
            select(PartCatalogItem).where(
                PartCatalogItem.id == item_id,
                PartCatalogItem.workshop_id == workshop_id,
            )
        )
        return result.scalar_one_or_none()

    async def delete(self, item_id: str, workshop_id: str) -> bool:
        result = await self._session.execute(
            delete(PartCatalogItem).where(
                PartCatalogItem.id == item_id,
                PartCatalogItem.workshop_id == workshop_id,
            )
        )
        return result.rowcount > 0
