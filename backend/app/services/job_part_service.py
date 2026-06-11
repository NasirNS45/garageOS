import logging

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.job_card import JobCard, JobStatus
from app.repositories.job_card_repository import JobCardRepository
from app.repositories.job_part_repository import JobPartRepository
from app.schemas.job_part import JobPartCreate, JobPartResponse, JobPartUpdate

logger = logging.getLogger(__name__)


class JobPartService:
    def __init__(self, session: AsyncSession) -> None:
        self._part_repo = JobPartRepository(session)
        self._card_repo = JobCardRepository(session)
        self._session = session

    async def add_part(
        self, card_id: str, workshop_id: str, payload: JobPartCreate
    ) -> JobPartResponse:
        card = await self._card_repo.get_by_id(card_id, workshop_id)
        if card is None:
            raise NotFoundError("Job card not found")
        if card.status in (JobStatus.completed.value, JobStatus.cancelled.value):
            raise ForbiddenError("Cannot add parts to a completed or cancelled job")

        part = await self._part_repo.add(
            job_card_id=card_id,
            name=payload.name,
            quantity=payload.quantity,
            unit_price=payload.unit_price,
        )
        await self._sync_parts_charge(card_id, workshop_id)

        logger.info(
            "Part added to job card",
            extra={"card_id": card_id, "part_id": part.id},
        )
        return JobPartResponse.model_validate(part)

    async def list_parts(self, card_id: str, workshop_id: str) -> list[JobPartResponse]:
        card = await self._card_repo.get_by_id(card_id, workshop_id)
        if card is None:
            raise NotFoundError("Job card not found")
        parts = await self._part_repo.list_by_job(card_id)
        return [JobPartResponse.model_validate(p) for p in parts]

    async def update_part(
        self, card_id: str, workshop_id: str, part_id: str, payload: JobPartUpdate
    ) -> JobPartResponse:
        card = await self._card_repo.get_by_id(card_id, workshop_id)
        if card is None:
            raise NotFoundError("Job card not found")
        if card.status in (JobStatus.completed.value, JobStatus.cancelled.value):
            raise ForbiddenError("Cannot edit parts on a completed or cancelled job")

        updated = await self._part_repo.update(
            part_id,
            card_id,
            name=payload.name,
            quantity=payload.quantity,
            unit_price=payload.unit_price,
        )
        if updated is None:
            raise NotFoundError("Part not found")

        await self._sync_parts_charge(card_id, workshop_id)
        logger.info("Part updated", extra={"card_id": card_id, "part_id": part_id})
        return JobPartResponse.model_validate(updated)

    async def remove_part(self, card_id: str, workshop_id: str, part_id: str) -> None:
        card = await self._card_repo.get_by_id(card_id, workshop_id)
        if card is None:
            raise NotFoundError("Job card not found")
        if card.status in (JobStatus.completed.value, JobStatus.cancelled.value):
            raise ForbiddenError("Cannot remove parts from a completed or cancelled job")

        deleted = await self._part_repo.remove(part_id, card_id)
        if not deleted:
            raise NotFoundError("Part not found")

        await self._sync_parts_charge(card_id, workshop_id)
        logger.info(
            "Part removed from job card",
            extra={"card_id": card_id, "part_id": part_id},
        )

    async def _sync_parts_charge(self, card_id: str, workshop_id: str) -> None:
        """Recompute and persist parts_charge + total_amount on the job card."""
        parts_total = await self._part_repo.sum_for_job(card_id)
        card = await self._card_repo.get_by_id(card_id, workshop_id)
        if card is None:
            return
        new_total = parts_total + float(card.labour_charge)
        await self._session.execute(
            update(JobCard)
            .where(JobCard.id == card_id, JobCard.workshop_id == workshop_id)
            .values(parts_charge=parts_total, total_amount=new_total)
        )
        await self._session.flush()
