from datetime import date

from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import DbSession, OwnerClaims
from app.schemas.expense import ExpenseCreate, ExpenseListResponse, ExpenseResponse
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    payload: ExpenseCreate, claims: OwnerClaims, session: DbSession
) -> ExpenseResponse:
    """Record a workshop expense (owner only)."""
    async with session.begin():
        return await ExpenseService(session).create(claims.workshop_id, payload)


@router.get("", response_model=ExpenseListResponse, status_code=status.HTTP_200_OK)
async def list_expenses(
    claims: OwnerClaims,
    session: DbSession,
    start_date: date = Query(..., description="Range start date (ISO)"),
    end_date: date = Query(..., description="Range end date (ISO)"),
) -> ExpenseListResponse:
    """List expenses in a date range with totals (owner only)."""
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_date must be on or before end_date",
        )
    async with session.begin():
        return await ExpenseService(session).list_by_range(
            claims.workshop_id, start_date, end_date
        )


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str, claims: OwnerClaims, session: DbSession
) -> None:
    """Delete an expense (owner only)."""
    async with session.begin():
        await ExpenseService(session).delete(claims.workshop_id, expense_id)
