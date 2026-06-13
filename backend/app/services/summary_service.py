import csv
import io
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.expense_repository import ExpenseRepository
from app.repositories.job_card_repository import JobCardRepository
from app.schemas.summary import (
    DailySeriesPoint,
    DailySummaryResponse,
    MechanicSummaryItem,
    RangeSummaryResponse,
)


class SummaryService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = JobCardRepository(session)
        self._expense_repo = ExpenseRepository(session)

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
        _, _, total_expenses = await self._expense_repo.list_by_range(
            workshop_id, start_date, end_date
        )
        total_revenue = float(data["total_revenue"])  # type: ignore[arg-type]
        return RangeSummaryResponse(
            start_date=start_date,
            end_date=end_date,
            total_expenses=total_expenses,
            net_profit=total_revenue - total_expenses,
            **data,  # type: ignore[arg-type]
        )

    async def daily_series(
        self, workshop_id: str, start_date: date, end_date: date
    ) -> list[DailySeriesPoint]:
        """Per-day revenue/collected/expenses for charting. One point per day."""
        revenue = await self._repo.revenue_by_day(workshop_id, start_date, end_date)
        expenses = await self._expense_repo.sum_by_day(workshop_id, start_date, end_date)

        points: list[DailySeriesPoint] = []
        current = start_date
        while current <= end_date:
            key = current.isoformat()
            rev = revenue.get(key, {"revenue": 0.0, "collected": 0.0})
            points.append(
                DailySeriesPoint(
                    date=current,
                    revenue=rev["revenue"],
                    collected=rev["collected"],
                    expenses=expenses.get(key, 0.0),
                )
            )
            current += timedelta(days=1)
        return points

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
