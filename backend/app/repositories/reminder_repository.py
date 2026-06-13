from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service_reminder import ReminderStatus, ServiceReminder


class ReminderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, workshop_id: str, **fields: object) -> ServiceReminder:
        reminder = ServiceReminder(workshop_id=workshop_id, **fields)
        self._session.add(reminder)
        await self._session.flush()
        return reminder

    async def get_by_id(self, reminder_id: str, workshop_id: str) -> ServiceReminder | None:
        result = await self._session.execute(
            select(ServiceReminder).where(
                ServiceReminder.id == reminder_id,
                ServiceReminder.workshop_id == workshop_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_upcoming(self, workshop_id: str, limit: int = 100) -> list[ServiceReminder]:
        result = await self._session.execute(
            select(ServiceReminder)
            .where(
                ServiceReminder.workshop_id == workshop_id,
                ServiceReminder.status == ReminderStatus.pending.value,
            )
            .order_by(ServiceReminder.due_date.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_due(self, on_date: date) -> list[ServiceReminder]:
        """Pending reminders due on or before the given date (all workshops)."""
        result = await self._session.execute(
            select(ServiceReminder).where(
                ServiceReminder.status == ReminderStatus.pending.value,
                ServiceReminder.due_date <= on_date,
            )
        )
        return list(result.scalars().all())
