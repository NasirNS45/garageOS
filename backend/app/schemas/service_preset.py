from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ServicePresetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)
    default_labour: float = Field(default=0, ge=0)


class ServicePresetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workshop_id: str
    name: str
    description: str | None
    default_labour: float
    created_at: datetime
