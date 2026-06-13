import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.repositories.job_card_repository import JobCardRepository
from app.schemas.customer import (
    CustomerHistoryResponse,
    JobSummary,
    TopCustomerItem,
)
from app.services.invoice_service import InvoiceService
from app.utils.mobile import normalize_mobile

logger = logging.getLogger(__name__)


class CustomerService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = JobCardRepository(session)
        self._invoice_svc = InvoiceService()

    async def get_history(
        self,
        workshop_id: str,
        vehicle_number: str | None = None,
        phone: str | None = None,
    ) -> CustomerHistoryResponse:
        if not vehicle_number and not phone:
            raise ValidationError("Provide vehicle_number or phone")

        if phone:
            try:
                phone = normalize_mobile(phone)
            except ValueError as exc:
                raise ValidationError(str(exc)) from exc

        cards = (
            await self._repo.get_by_vehicle(workshop_id, vehicle_number)
            if vehicle_number
            else await self._repo.get_by_phone(workshop_id, phone)  # type: ignore[arg-type]
        )

        summaries = [
            JobSummary(
                id=c.id,
                vehicle_number=c.vehicle_number,
                status=c.status,
                total_amount=float(c.total_amount),
                invoice_number=c.invoice_number,
                invoice_url=(
                    self._invoice_svc.invoice_url(c.invoice_number) if c.invoice_number else None
                ),
                created_at=c.created_at,
                completed_at=c.completed_at,
            )
            for c in cards
        ]

        customer_name = cards[0].customer_name if cards else "Unknown"
        customer_phone = cards[0].customer_phone if cards else (phone or "")

        return CustomerHistoryResponse(
            customer_name=customer_name,
            customer_phone=customer_phone,
            vehicle_number=vehicle_number,
            total_jobs=len(summaries),
            jobs=summaries,
        )

    async def top_customers(self, workshop_id: str, limit: int = 20) -> list[TopCustomerItem]:
        rows = await self._repo.top_customers(workshop_id, limit)
        return [TopCustomerItem(**row) for row in rows]  # type: ignore[arg-type]
