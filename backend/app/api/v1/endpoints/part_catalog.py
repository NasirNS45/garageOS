from fastapi import APIRouter, status

from app.core.dependencies import CurrentClaims, DbSession, OwnerClaims
from app.schemas.part_catalog import PartCatalogCreate, PartCatalogResponse
from app.services.part_catalog_service import PartCatalogService

router = APIRouter(prefix="/part-catalog", tags=["part-catalog"])


@router.get("", response_model=list[PartCatalogResponse], status_code=status.HTTP_200_OK)
async def list_items(
    claims: CurrentClaims, session: DbSession
) -> list[PartCatalogResponse]:
    async with session.begin():
        return await PartCatalogService(session).list_items(claims.workshop_id)


@router.post("", response_model=PartCatalogResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    payload: PartCatalogCreate, claims: OwnerClaims, session: DbSession
) -> PartCatalogResponse:
    async with session.begin():
        return await PartCatalogService(session).create(claims.workshop_id, payload)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: str, claims: OwnerClaims, session: DbSession
) -> None:
    async with session.begin():
        await PartCatalogService(session).delete(claims.workshop_id, item_id)
