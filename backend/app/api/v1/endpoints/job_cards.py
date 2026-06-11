from fastapi import APIRouter, Query, status

from app.core.dependencies import CurrentClaims, DbSession, OwnerClaims
from app.schemas.job_card import (
    JobCardComplete,
    JobCardCreate,
    JobCardListResponse,
    JobCardResponse,
    JobCardUpdate,
)
from app.services.job_card_service import JobCardService

router = APIRouter(prefix="/job-cards", tags=["job-cards"])


@router.post("", response_model=JobCardResponse, status_code=status.HTTP_201_CREATED)
async def create_job_card(
    payload: JobCardCreate, claims: CurrentClaims, session: DbSession
) -> JobCardResponse:
    """Create a new job card."""
    async with session.begin():
        return await JobCardService(session).create(claims.workshop_id, payload)


@router.get("", response_model=JobCardListResponse, status_code=status.HTTP_200_OK)
async def list_job_cards(
    claims: CurrentClaims,
    session: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> JobCardListResponse:
    """List active job cards (paginated). Mechanics only see their assigned jobs."""
    mechanic_id = claims.user_id if claims.role == "mechanic" else None
    async with session.begin():
        return await JobCardService(session).list_active(
            claims.workshop_id, page, page_size, mechanic_id=mechanic_id
        )


@router.get("/{card_id}", response_model=JobCardResponse, status_code=status.HTTP_200_OK)
async def get_job_card(card_id: str, claims: CurrentClaims, session: DbSession) -> JobCardResponse:
    """Get a single job card."""
    async with session.begin():
        return await JobCardService(session).get(card_id, claims.workshop_id)


@router.put("/{card_id}", response_model=JobCardResponse, status_code=status.HTTP_200_OK)
async def update_job_card(
    card_id: str, payload: JobCardUpdate, claims: CurrentClaims, session: DbSession
) -> JobCardResponse:
    """Update a job card."""
    async with session.begin():
        return await JobCardService(session).update(card_id, claims.workshop_id, payload)


@router.put(
    "/{card_id}/complete",
    response_model=JobCardResponse,
    status_code=status.HTTP_200_OK,
)
async def complete_job_card(
    card_id: str,
    claims: OwnerClaims,
    session: DbSession,
    payload: JobCardComplete | None = None,
) -> JobCardResponse:
    """Mark a job as complete, generate invoice, optionally send WhatsApp (owner only)."""
    notify = payload.notify_customer if payload is not None else True
    async with session.begin():
        return await JobCardService(session).complete(
            card_id, claims.workshop_id, notify_customer=notify
        )


@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_job_card(card_id: str, claims: OwnerClaims, session: DbSession) -> None:
    """Cancel a job card (owner only)."""
    async with session.begin():
        await JobCardService(session).delete(card_id, claims.workshop_id)
