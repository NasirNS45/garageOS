from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense


class ExpenseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, workshop_id: str, **fields: object) -> Expense:
        expense = Expense(workshop_id=workshop_id, **fields)
        self._session.add(expense)
        await self._session.flush()
        return expense

    async def get_by_id(self, expense_id: str, workshop_id: str) -> Expense | None:
        result = await self._session.execute(
            select(Expense).where(
                Expense.id == expense_id,
                Expense.workshop_id == workshop_id,
            )
        )
        return result.scalar_one_or_none()

    async def delete(self, expense: Expense) -> None:
        await self._session.delete(expense)
        await self._session.flush()

    async def list_by_range(
        self, workshop_id: str, start: date, end: date
    ) -> tuple[list[Expense], int, float]:
        """Expenses in range (newest first) with count and total amount."""
        where = (
            Expense.workshop_id == workshop_id,
            Expense.expense_date >= start,
            Expense.expense_date <= end,
        )
        rows = await self._session.execute(
            select(Expense)
            .where(*where)
            .order_by(Expense.expense_date.desc(), Expense.created_at.desc())
            .limit(200)
        )
        totals = await self._session.execute(
            select(
                func.count(Expense.id),
                func.coalesce(func.sum(Expense.amount), 0),
            ).where(*where)
        )
        count, total_amount = totals.one()
        return list(rows.scalars().all()), int(count), float(total_amount)

    async def sum_by_day(
        self, workshop_id: str, start: date, end: date
    ) -> dict[str, float]:
        """Map of ISO date -> total expenses for that day."""
        result = await self._session.execute(
            select(
                Expense.expense_date,
                func.coalesce(func.sum(Expense.amount), 0),
            )
            .where(
                Expense.workshop_id == workshop_id,
                Expense.expense_date >= start,
                Expense.expense_date <= end,
            )
            .group_by(Expense.expense_date)
        )
        return {str(day): float(total) for day, total in result.all()}
