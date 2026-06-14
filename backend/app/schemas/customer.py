from datetime import datetime

from pydantic import BaseModel


class JobSummary(BaseModel):
    id: str
    vehicle_number: str
    status: str
    total_amount: float
    collected_amount: float = 0
    balance_due: float = 0
    invoice_number: str | None
    invoice_url: str | None
    created_at: datetime
    completed_at: datetime | None


class CustomerHistoryResponse(BaseModel):
    customer_name: str
    customer_phone: str
    vehicle_number: str | None = None
    total_jobs: int
    total_outstanding: float = 0
    jobs: list[JobSummary]


class TopCustomerItem(BaseModel):
    customer_name: str
    customer_phone: str
    total_jobs: int
    total_spent: float
    total_outstanding: float = 0
    last_visit: datetime | None


class OutstandingCustomerItem(BaseModel):
    customer_name: str
    customer_phone: str
    total_outstanding: float
    open_invoices: int
