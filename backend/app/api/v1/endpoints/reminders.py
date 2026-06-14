from fastapi import APIRouter, status

from app.core.dependencies import DbSession, OwnerClaims
from app.schemas.reminder import ReminderCreate, ReminderResponse
from app.services.reminder_service import ReminderService

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderResponse], status_code=status.HTTP_200_OK)
async def list_reminders(claims: OwnerClaims, session: DbSession) -> list[ReminderResponse]:
    """Upcoming (pending) service reminders, soonest first (owner only)."""
    async with session.begin():
        return await ReminderService(session).list_upcoming(claims.workshop_id)


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    payload: ReminderCreate, claims: OwnerClaims, session: DbSession
) -> ReminderResponse:
    """Create a manual service reminder (owner only)."""
    async with session.begin():
        return await ReminderService(session).create_manual(claims.workshop_id, payload)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_reminder(
    reminder_id: str, claims: OwnerClaims, session: DbSession
) -> None:
    """Cancel a pending reminder (owner only)."""
    async with session.begin():
        await ReminderService(session).cancel(claims.workshop_id, reminder_id)
