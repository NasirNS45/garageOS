import logging
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.job_card import JobCard
from app.models.service_reminder import ReminderStatus
from app.models.workshop import Workshop
from app.repositories.job_card_repository import JobCardRepository
from app.repositories.reminder_repository import ReminderRepository
from app.schemas.reminder import ReminderCreate, ReminderResponse

logger = logging.getLogger(__name__)


class ReminderService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = ReminderRepository(session)
        self._card_repo = JobCardRepository(session)

    async def maybe_create_for_completion(self, workshop: Workshop, card: JobCard) -> None:
        """Auto-schedule a service reminder when a job completes, if enabled."""
        interval = workshop.reminder_interval_days or 0
        if interval <= 0 or not card.customer_phone:
            return
        due = date.today() + timedelta(days=interval)
        await self._repo.create(
            workshop_id=workshop.id,
            job_card_id=card.id,
            customer_name=card.customer_name,
            customer_phone=card.customer_phone,
            vehicle_number=card.vehicle_number,
            service_note=(card.description or None),
            due_date=due,
            status=ReminderStatus.pending.value,
        )
        logger.info(
            "Service reminder scheduled",
            extra={"workshop_id": workshop.id, "card_id": card.id, "due": str(due)},
        )

    async def list_upcoming(self, workshop_id: str) -> list[ReminderResponse]:
        rows = await self._repo.list_upcoming(workshop_id)
        return [ReminderResponse.model_validate(r) for r in rows]

    async def create_manual(
        self, workshop_id: str, payload: ReminderCreate
    ) -> ReminderResponse:
        card = await self._card_repo.get_by_id(payload.job_card_id, workshop_id)
        if card is None:
            raise NotFoundError("Job card not found")

        reminder = await self._repo.create(
            workshop_id=workshop_id,
            job_card_id=card.id,
            customer_name=card.customer_name,
            customer_phone=card.customer_phone,
            vehicle_number=card.vehicle_number,
            service_note=payload.service_note or card.description,
            due_date=payload.due_date,
            status=ReminderStatus.pending.value,
        )
        logger.info(
            "Manual service reminder created",
            extra={"workshop_id": workshop_id, "card_id": card.id},
        )
        return ReminderResponse.model_validate(reminder)

    async def cancel(self, workshop_id: str, reminder_id: str) -> None:
        reminder = await self._repo.get_by_id(reminder_id, workshop_id)
        if reminder is None:
            raise NotFoundError("Reminder not found")
        reminder.status = ReminderStatus.cancelled.value
