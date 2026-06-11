from datetime import datetime

from pydantic import BaseModel


class JobSummary(BaseModel):
    id: str
    vehicle_number: str
    status: str
    total_amount: float
    invoice_number: str | None
    invoice_url: str | None
    created_at: datetime
    completed_at: datetime | None


class CustomerHistoryResponse(BaseModel):
    customer_name: str
    customer_phone: str
    vehicle_number: str | None = None
    total_jobs: int
    jobs: list[JobSummary]
