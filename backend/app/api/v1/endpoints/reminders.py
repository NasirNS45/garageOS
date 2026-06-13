from fastapi import APIRouter, status

from app.core.dependencies import DbSession, OwnerClaims
from app.schemas.reminder import ReminderResponse
from app.services.reminder_service import ReminderService

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderResponse], status_code=status.HTTP_200_OK)
async def list_reminders(claims: OwnerClaims, session: DbSession) -> list[ReminderResponse]:
    """Upcoming (pending) service reminders, soonest first (owner only)."""
    async with session.begin():
        return await ReminderService(session).list_upcoming(claims.workshop_id)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_reminder(
    reminder_id: str, claims: OwnerClaims, session: DbSession
) -> None:
    """Cancel a pending reminder (owner only)."""
    async with session.begin():
        await ReminderService(session).cancel(claims.workshop_id, reminder_id)
