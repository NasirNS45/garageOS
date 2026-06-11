from fastapi import APIRouter, status

from app.core.dependencies import CurrentClaims, DbSession, OwnerClaims
from app.schemas.service_preset import ServicePresetCreate, ServicePresetResponse
from app.services.service_preset_service import ServicePresetService

router = APIRouter(prefix="/service-presets", tags=["service-presets"])


@router.get("", response_model=list[ServicePresetResponse], status_code=status.HTTP_200_OK)
async def list_presets(
    claims: CurrentClaims, session: DbSession
) -> list[ServicePresetResponse]:
    """List all service presets for this workshop."""
    async with session.begin():
        return await ServicePresetService(session).list_presets(claims.workshop_id)


@router.post(
    "", response_model=ServicePresetResponse, status_code=status.HTTP_201_CREATED
)
async def create_preset(
    payload: ServicePresetCreate, claims: OwnerClaims, session: DbSession
) -> ServicePresetResponse:
    """Create a service preset (owner only)."""
    async with session.begin():
        return await ServicePresetService(session).create(claims.workshop_id, payload)


@router.delete("/{preset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_preset(
    preset_id: str, claims: OwnerClaims, session: DbSession
) -> None:
    """Delete a service preset (owner only)."""
    async with session.begin():
        await ServicePresetService(session).delete(claims.workshop_id, preset_id)
