from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import ExpenseCreate, ExpenseListResponse, ExpenseResponse


class ExpenseService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = ExpenseRepository(session)

    async def create(self, workshop_id: str, payload: ExpenseCreate) -> ExpenseResponse:
        expense = await self._repo.create(
            workshop_id=workshop_id,
            expense_date=payload.expense_date,
            category=payload.category.value,
            amount=payload.amount,
            note=payload.note,
        )
        return ExpenseResponse.model_validate(expense)

    async def list_by_range(
        self, workshop_id: str, start: date, end: date
    ) -> ExpenseListResponse:
        items, total, total_amount = await self._repo.list_by_range(workshop_id, start, end)
        return ExpenseListResponse(
            items=[ExpenseResponse.model_validate(e) for e in items],
            total=total,
            total_amount=total_amount,
        )

    async def delete(self, workshop_id: str, expense_id: str) -> None:
        expense = await self._repo.get_by_id(expense_id, workshop_id)
        if expense is None:
            raise NotFoundError("Expense not found")
        await self._repo.delete(expense)
