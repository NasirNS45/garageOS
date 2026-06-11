import csv
import io
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.job_card_repository import JobCardRepository
from app.schemas.summary import (
    DailySummaryResponse,
    MechanicSummaryItem,
    RangeSummaryResponse,
)


class SummaryService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = JobCardRepository(session)

    async def daily(
        self, workshop_id: str, target_date: date | None = None
    ) -> DailySummaryResponse:
        if target_date is None:
            target_date = date.today()
        data = await self._repo.daily_summary(workshop_id, target_date)
        return DailySummaryResponse(date=target_date, **data)  # type: ignore[arg-type]

    async def range_summary(
        self, workshop_id: str, start_date: date, end_date: date
    ) -> RangeSummaryResponse:
        data = await self._repo.range_summary(workshop_id, start_date, end_date)
        return RangeSummaryResponse(
            start_date=start_date,
            end_date=end_date,
            **data,  # type: ignore[arg-type]
        )

    async def mechanic_summary(
        self, workshop_id: str, start_date: date, end_date: date
    ) -> list[MechanicSummaryItem]:
        rows = await self._repo.mechanic_summary(workshop_id, start_date, end_date)
        return [MechanicSummaryItem(**row) for row in rows]  # type: ignore[arg-type]

    async def export_csv(
        self, workshop_id: str, start_date: date, end_date: date
    ) -> str:
        """Return completed jobs in range as a UTF-8 CSV string."""
        rows = await self._repo.list_completed_in_range(workshop_id, start_date, end_date)
        fieldnames = [
            "invoice_number",
            "date",
            "vehicle_number",
            "vehicle_make",
            "customer_name",
            "customer_phone",
            "description",
            "labour_charge",
            "parts_charge",
            "total_amount",
            "payment_status",
            "mechanic",
        ]
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)  # type: ignore[arg-type]
        return buf.getvalue()
