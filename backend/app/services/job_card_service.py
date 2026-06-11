import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.job_card import JobStatus
from app.repositories.job_card_repository import JobCardRepository
from app.repositories.job_part_repository import JobPartRepository
from app.repositories.workshop_repository import WorkshopRepository
from app.schemas.job_card import (
    JobCardCreate,
    JobCardListResponse,
    JobCardResponse,
    JobCardUpdate,
)
from app.schemas.job_part import JobPartResponse
from app.services.invoice_service import InvoiceService
from app.services.whatsapp_service import WhatsAppService
from app.utils.mobile import normalize_mobile

logger = logging.getLogger(__name__)


def _to_response(
    card: object,
    invoice_svc: InvoiceService,
    parts: list[JobPartResponse] | None = None,
) -> JobCardResponse:
    """Map a JobCard ORM object to a response schema, injecting invoice URL and parts."""
    resp = JobCardResponse.model_validate(card)
    if resp.invoice_number:
        resp.invoice_url = invoice_svc.invoice_url(resp.invoice_number)
    if parts is not None:
        resp.parts = parts
    return resp


class JobCardService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = JobCardRepository(session)
        self._part_repo = JobPartRepository(session)
        self._workshop_repo = WorkshopRepository(session)
        self._invoice_svc = InvoiceService()
        self._whatsapp_svc = WhatsAppService()

    async def create(self, workshop_id: str, payload: JobCardCreate) -> JobCardResponse:
        try:
            phone = normalize_mobile(payload.customer_phone)
        except ValueError as exc:
            from app.core.exceptions import ValidationError

            raise ValidationError(str(exc)) from exc

        # Auto-transition: assigning a mechanic at creation starts the job immediately
        initial_status = (
            JobStatus.in_progress.value if payload.assigned_mechanic_id else JobStatus.pending.value
        )

        card = await self._repo.create(
            workshop_id=workshop_id,
            vehicle_number=payload.vehicle_number.upper().strip(),
            vehicle_make=payload.vehicle_make,
            customer_name=payload.customer_name,
            customer_phone=phone,
            status=initial_status,
            assigned_mechanic_id=payload.assigned_mechanic_id,
            description=payload.description,
            labour_charge=payload.labour_charge,
            parts_charge=payload.parts_charge,
            total_amount=payload.labour_charge + payload.parts_charge,
            notes=payload.notes,
        )
        logger.info("Job card created", extra={"card_id": card.id, "workshop_id": workshop_id})

        if payload.notify_checkin:
            workshop = await self._workshop_repo.get_by_id(workshop_id)
            workshop_name = workshop.name if workshop else "the workshop"
            try:
                await self._whatsapp_svc.send_checkin_notification(
                    customer_phone=phone,
                    customer_name=payload.customer_name,
                    vehicle_number=card.vehicle_number,  # type: ignore[union-attr]
                    workshop_name=workshop_name,
                )
            except Exception as exc:
                logger.error(
                    "Check-in WhatsApp notification failed",
                    extra={"error": str(exc)},
                )

        return _to_response(card, self._invoice_svc)

    async def list_active(
        self,
        workshop_id: str,
        page: int = 1,
        page_size: int = 20,
        mechanic_id: str | None = None,
    ) -> JobCardListResponse:
        cards, total = await self._repo.list_active(
            workshop_id, page, page_size, mechanic_id=mechanic_id
        )
        card_ids = [c.id for c in cards]  # type: ignore[union-attr]
        all_parts = await self._part_repo.list_by_jobs(card_ids)

        parts_by_card: dict[str, list[JobPartResponse]] = {}
        for p in all_parts:
            parts_by_card.setdefault(
                p.job_card_id,
                [],  # type: ignore[union-attr]
            ).append(JobPartResponse.model_validate(p))

        return JobCardListResponse(
            items=[
                _to_response(
                    c,
                    self._invoice_svc,
                    parts=parts_by_card.get(c.id, []),  # type: ignore[union-attr]
                )
                for c in cards
            ],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get(self, card_id: str, workshop_id: str) -> JobCardResponse:
        card = await self._repo.get_by_id(card_id, workshop_id)
        if card is None:
            raise NotFoundError("Job card not found")
        parts = await self._part_repo.list_by_job(card_id)
        part_responses = [JobPartResponse.model_validate(p) for p in parts]
        return _to_response(card, self._invoice_svc, parts=part_responses)

    async def update(
        self, card_id: str, workshop_id: str, payload: JobCardUpdate
    ) -> JobCardResponse:
        card = await self._repo.get_by_id(card_id, workshop_id)
        if card is None:
            raise NotFoundError("Job card not found")
        update_fields = payload.model_dump(exclude_unset=True)

        # Allow payment_status updates on completed cards; block all other edits.
        is_completed = card.status == JobStatus.completed.value

        if is_completed:
            non_payment_fields = {k for k in update_fields if k != "payment_status"}
            if non_payment_fields:
                raise ForbiddenError("Completed job cards cannot be edited")

        if not is_completed:
            # Normalize phone if provided
            if "customer_phone" in update_fields:
                try:
                    update_fields["customer_phone"] = normalize_mobile(
                        update_fields["customer_phone"]
                    )
                except ValueError as exc:
                    from app.core.exceptions import ValidationError

                    raise ValidationError(str(exc)) from exc

            # Normalize vehicle number
            if "vehicle_number" in update_fields:
                update_fields["vehicle_number"] = update_fields["vehicle_number"].upper().strip()

            # Auto-transition: assigning a mechanic to a pending job starts it
            new_mechanic = update_fields.get("assigned_mechanic_id")
            if new_mechanic is not None and card.status == JobStatus.pending.value:
                update_fields["status"] = JobStatus.in_progress.value

            # Recompute total if charges change
            labour = update_fields.get("labour_charge", card.labour_charge)
            parts = update_fields.get("parts_charge", card.parts_charge)
            update_fields["total_amount"] = float(labour) + float(parts)

        updated = await self._repo.update(card_id, workshop_id, **update_fields)
        parts_list = await self._part_repo.list_by_job(card_id)
        part_responses = [JobPartResponse.model_validate(p) for p in parts_list]
        return _to_response(updated, self._invoice_svc, parts=part_responses)

    async def complete(
        self,
        card_id: str,
        workshop_id: str,
        notify_customer: bool = True,
    ) -> JobCardResponse:
        card = await self._repo.get_by_id(card_id, workshop_id)
        if card is None:
            raise NotFoundError("Job card not found")
        if card.status == JobStatus.completed.value:
            raise ForbiddenError("Job card is already completed")
        if card.status == JobStatus.cancelled.value:
            raise ForbiddenError("Cannot complete a cancelled job card")

        sequence = await self._repo.count_today_invoices(workshop_id) + 1
        invoice_number = self._invoice_svc.make_invoice_number(workshop_id, sequence)
        total = float(card.labour_charge) + float(card.parts_charge)

        completed = await self._repo.complete(card_id, workshop_id, invoice_number, total)
        invoice_url = self._invoice_svc.invoice_url(invoice_number)

        logger.info("Job card completed", extra={"card_id": card_id, "invoice": invoice_number})

        if notify_customer:
            try:
                await self._whatsapp_svc.send_completion_notification(
                    customer_phone=completed.customer_phone,  # type: ignore[union-attr]
                    customer_name=completed.customer_name,  # type: ignore[union-attr]
                    vehicle_number=completed.vehicle_number,  # type: ignore[union-attr]
                    invoice_number=invoice_number,
                    total_amount=total,
                    invoice_url=invoice_url,
                )
            except Exception as exc:
                logger.error(
                    "WhatsApp completion notification failed",
                    extra={"error": str(exc)},
                )

        parts_list = await self._part_repo.list_by_job(card_id)
        part_responses = [JobPartResponse.model_validate(p) for p in parts_list]
        resp = _to_response(completed, self._invoice_svc, parts=part_responses)
        resp.invoice_url = invoice_url
        return resp

    async def delete(self, card_id: str, workshop_id: str) -> None:
        card = await self._repo.get_by_id(card_id, workshop_id)
        if card is None:
            raise NotFoundError("Job card not found")
        await self._repo.update(card_id, workshop_id, status=JobStatus.cancelled.value)
        logger.info("Job card cancelled", extra={"card_id": card_id})
