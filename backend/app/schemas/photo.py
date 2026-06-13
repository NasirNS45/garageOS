from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ALLOWED_CONTENT_TYPES = ("image/jpeg", "image/png", "image/webp")
ContentType = Literal["image/jpeg", "image/png", "image/webp"]


class PhotoPresignRequest(BaseModel):
    content_type: ContentType = Field(..., description="MIME type of the image")


class PhotoPresignResponse(BaseModel):
    upload_url: str
    object_key: str
    public_url: str


class PhotoCreate(BaseModel):
    object_key: str = Field(..., max_length=500)
    public_url: str = Field(..., max_length=1000)
    caption: str | None = Field(default=None, max_length=200)


class PhotoResponse(BaseModel):
    id: str
    url: str
    caption: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
