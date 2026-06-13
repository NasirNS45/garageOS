from fastapi import APIRouter, status

from app.core.dependencies import CurrentClaims, DbSession
from app.schemas.photo import (
    PhotoCreate,
    PhotoPresignRequest,
    PhotoPresignResponse,
    PhotoResponse,
)
from app.services.photo_service import PhotoService

router = APIRouter(prefix="/job-cards/{card_id}/photos", tags=["photos"])


@router.post("/presign", response_model=PhotoPresignResponse, status_code=status.HTTP_200_OK)
async def presign_photo(
    card_id: str,
    payload: PhotoPresignRequest,
    claims: CurrentClaims,
    session: DbSession,
) -> PhotoPresignResponse:
    """Get a short-lived URL to upload an image directly to object storage."""
    async with session.begin():
        return await PhotoService(session).presign(
            claims.workshop_id, card_id, payload.content_type
        )


@router.post("", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def add_photo(
    card_id: str,
    payload: PhotoCreate,
    claims: CurrentClaims,
    session: DbSession,
) -> PhotoResponse:
    """Record a photo after it has been uploaded to storage."""
    async with session.begin():
        return await PhotoService(session).create(claims.workshop_id, card_id, payload)


@router.get("", response_model=list[PhotoResponse], status_code=status.HTTP_200_OK)
async def list_photos(
    card_id: str, claims: CurrentClaims, session: DbSession
) -> list[PhotoResponse]:
    async with session.begin():
        return await PhotoService(session).list_for_job(claims.workshop_id, card_id)


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    card_id: str, photo_id: str, claims: CurrentClaims, session: DbSession
) -> None:
    async with session.begin():
        await PhotoService(session).delete(claims.workshop_id, photo_id)
