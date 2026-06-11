from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class JobPartCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Part or service name")
    quantity: Decimal = Field(default=Decimal("1"), gt=0, description="Quantity (e.g. 2.5 litres)")
    unit_price: Decimal = Field(..., ge=0, description="Unit price in PKR")


class JobPartUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    quantity: Decimal | None = Field(None, gt=0)
    unit_price: Decimal | None = Field(None, ge=0)


class JobPartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_card_id: str
    name: str
    quantity: float
    unit_price: float
    line_total: float
    created_at: datetime
