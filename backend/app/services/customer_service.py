import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.repositories.job_card_repository import JobCardRepository
from app.schemas.customer import (
    CustomerHistoryResponse,
    JobSummary,
    OutstandingCustomerItem,
    TopCustomerItem,
)
from app.services.invoice_service import InvoiceService
from app.utils.mobile import normalize_mobile

logger = logging.getLogger(__name__)


class CustomerService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = JobCardRepository(session)
        self._invoice_svc = InvoiceService()

    def _job_summary(self, card: object) -> JobSummary:
        total = float(card.total_amount)  # type: ignore[union-attr]
        collected = float(card.collected_amount)  # type: ignore[union-attr]
        balance = max(total - collected, 0) if card.status == "completed" else 0  # type: ignore[union-attr]
        return JobSummary(
            id=card.id,  # type: ignore[union-attr]
            vehicle_number=card.vehicle_number,  # type: ignore[union-attr]
            status=card.status,  # type: ignore[union-attr]
            total_amount=total,
            collected_amount=collected,
            balance_due=balance,
            invoice_number=card.invoice_number,  # type: ignore[union-attr]
            invoice_url=(
                self._invoice_svc.invoice_url(card.invoice_number)  # type: ignore[union-attr]
                if card.invoice_number  # type: ignore[union-attr]
                else None
            ),
            created_at=card.created_at,  # type: ignore[union-attr]
            completed_at=card.completed_at,  # type: ignore[union-attr]
        )

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

        summaries = [self._job_summary(c) for c in cards]
        total_outstanding = sum(s.balance_due for s in summaries)

        customer_name = cards[0].customer_name if cards else "Unknown"
        customer_phone = cards[0].customer_phone if cards else (phone or "")

        return CustomerHistoryResponse(
            customer_name=customer_name,
            customer_phone=customer_phone,
            vehicle_number=vehicle_number,
            total_jobs=len(summaries),
            total_outstanding=total_outstanding,
            jobs=summaries,
        )

    async def top_customers(self, workshop_id: str, limit: int = 20) -> list[TopCustomerItem]:
        rows = await self._repo.top_customers(workshop_id, limit)
        return [TopCustomerItem(**row) for row in rows]  # type: ignore[arg-type]

    async def outstanding_customers(
        self, workshop_id: str, limit: int = 20
    ) -> list[OutstandingCustomerItem]:
        rows = await self._repo.customers_with_outstanding(workshop_id, limit)
        return [OutstandingCustomerItem(**row) for row in rows]  # type: ignore[arg-type]
