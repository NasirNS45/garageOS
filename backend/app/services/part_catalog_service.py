import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.part_catalog_repository import PartCatalogRepository
from app.schemas.part_catalog import PartCatalogCreate, PartCatalogResponse

logger = logging.getLogger(__name__)


class PartCatalogService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = PartCatalogRepository(session)

    async def create(self, workshop_id: str, payload: PartCatalogCreate) -> PartCatalogResponse:
        item = await self._repo.create(
            workshop_id=workshop_id,
            name=payload.name.strip(),
            default_price=payload.default_price,
        )
        logger.info("Part catalog item created", extra={"item_id": item.id})
        return PartCatalogResponse.model_validate(item)

    async def list_items(self, workshop_id: str) -> list[PartCatalogResponse]:
        items = await self._repo.list_by_workshop(workshop_id)
        return [PartCatalogResponse.model_validate(i) for i in items]

    async def delete(self, workshop_id: str, item_id: str) -> None:
        deleted = await self._repo.delete(item_id, workshop_id)
        if not deleted:
            raise NotFoundError("Part catalog item not found")
        logger.info("Part catalog item deleted", extra={"item_id": item_id})
