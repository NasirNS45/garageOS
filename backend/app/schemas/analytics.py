from typing import Any

from pydantic import BaseModel, Field


class PilotEventCreate(BaseModel):
    event_name: str = Field(..., min_length=1, max_length=80)
    metadata: dict[str, Any] | None = None


class PilotSummaryResponse(BaseModel):
    events: dict[str, int]
    whatsapp_delivery_rate: float | None = None
    time_to_first_job_minutes: float | None = None
