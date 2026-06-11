from fastapi import APIRouter, status

from app.core.dependencies import CurrentClaims, DbSession
from app.schemas.job_part import JobPartCreate, JobPartResponse, JobPartUpdate
from app.services.job_part_service import JobPartService

router = APIRouter(prefix="/job-cards", tags=["job-parts"])


@router.get(
    "/{card_id}/parts",
    response_model=list[JobPartResponse],
    status_code=status.HTTP_200_OK,
)
async def list_parts(
    card_id: str, claims: CurrentClaims, session: DbSession
) -> list[JobPartResponse]:
    """List all parts for a job card."""
    async with session.begin():
        return await JobPartService(session).list_parts(card_id, claims.workshop_id)


@router.post(
    "/{card_id}/parts",
    response_model=JobPartResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_part(
    card_id: str,
    payload: JobPartCreate,
    claims: CurrentClaims,
    session: DbSession,
) -> JobPartResponse:
    """Add a part line item to an active job card."""
    async with session.begin():
        return await JobPartService(session).add_part(card_id, claims.workshop_id, payload)


@router.patch(
    "/{card_id}/parts/{part_id}",
    response_model=JobPartResponse,
    status_code=status.HTTP_200_OK,
)
async def update_part(
    card_id: str,
    part_id: str,
    payload: JobPartUpdate,
    claims: CurrentClaims,
    session: DbSession,
) -> JobPartResponse:
    """Edit a part's name, quantity, or unit price."""
    async with session.begin():
        return await JobPartService(session).update_part(
            card_id, claims.workshop_id, part_id, payload
        )


@router.delete(
    "/{card_id}/parts/{part_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_part(
    card_id: str,
    part_id: str,
    claims: CurrentClaims,
    session: DbSession,
) -> None:
    """Remove a part from a job card."""
    async with session.begin():
        await JobPartService(session).remove_part(card_id, claims.workshop_id, part_id)
