from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.expense import ExpenseCategory


class ExpenseCreate(BaseModel):
    expense_date: date = Field(..., description="Date the expense was incurred")
    category: ExpenseCategory = Field(
        default=ExpenseCategory.other, description="Expense category"
    )
    amount: float = Field(..., gt=0, le=99_999_999, description="Amount in PKR")
    note: str | None = Field(default=None, max_length=500, description="Optional note")


class ExpenseResponse(BaseModel):
    id: str
    expense_date: date
    category: str
    amount: float
    note: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExpenseListResponse(BaseModel):
    items: list[ExpenseResponse]
    total: int
    total_amount: float
