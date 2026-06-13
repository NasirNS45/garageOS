from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.job_card import JobStatus, PaymentStatus
from app.schemas.job_part import JobPartResponse


class JobCardCreate(BaseModel):
    vehicle_number: str = Field(
        ..., min_length=1, max_length=50, description="Vehicle registration"
    )
    vehicle_make: str | None = Field(None, max_length=100, description="Vehicle make/brand")
    customer_name: str = Field(..., min_length=1, max_length=200)
    customer_phone: str = Field(..., description="Customer mobile number")
    assigned_mechanic_id: str | None = None
    description: str | None = None
    labour_charge: float = Field(default=0.0, ge=0)
    parts_charge: float = Field(default=0.0, ge=0)
    notes: str | None = None
    notify_checkin: bool = False


class JobCardUpdate(BaseModel):
    vehicle_number: str | None = Field(None, max_length=50)
    vehicle_make: str | None = Field(None, max_length=100)
    customer_name: str | None = Field(None, max_length=200)
    customer_phone: str | None = None
    status: JobStatus | None = None
    assigned_mechanic_id: str | None = None
    description: str | None = None
    labour_charge: float | None = Field(None, ge=0)
    parts_charge: float | None = Field(None, ge=0)
    payment_status: PaymentStatus | None = None
    notes: str | None = None


class JobCardComplete(BaseModel):
    notify_customer: bool = True


class JobCardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workshop_id: str
    vehicle_number: str
    vehicle_make: str | None
    customer_name: str
    customer_phone: str
    status: str
    assigned_mechanic_id: str | None
    description: str | None
    labour_charge: float
    parts_charge: float
    total_amount: float
    invoice_number: str | None
    invoice_url: str | None = None
    track_url: str | None = None
    payment_status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    parts: list[JobPartResponse] = []


class JobCardListResponse(BaseModel):
    items: list[JobCardResponse]
    total: int
    page: int
    page_size: int
