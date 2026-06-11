from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PartCatalogCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    default_price: float = Field(default=0, ge=0)


class PartCatalogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workshop_id: str
    name: str
    default_price: float
    created_at: datetime
