from datetime import date

from pydantic import BaseModel


class DailySummaryResponse(BaseModel):
    date: date
    total_jobs: int
    completed_jobs: int
    pending_jobs: int
    in_progress_jobs: int
    total_revenue: float       # total billed (all completed jobs)
    total_collected: float     # cash received (completed + marked paid)


class RangeSummaryResponse(BaseModel):
    start_date: date
    end_date: date
    total_jobs: int
    completed_jobs: int
    pending_jobs: int
    in_progress_jobs: int
    total_revenue: float
    total_collected: float


class MechanicSummaryItem(BaseModel):
    mechanic_id: str
    full_name: str
    completed_jobs: int
    total_labour: float
    total_revenue: float
