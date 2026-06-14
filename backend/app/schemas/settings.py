from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TestWhatsAppPayload(BaseModel):
    phone: str = Field(..., description="Phone number to send the test message to")


class WorkshopSettingsUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=200)
    address: str | None = Field(None, max_length=500)
    owner_contact: str | None = None
    whatsapp_number: str | None = None
    invoice_footer: str | None = Field(None, max_length=1000)
    bank_details: str | None = Field(None, max_length=500)
    reminder_interval_days: int | None = Field(None, ge=0, le=365)
    digest_enabled: bool | None = None
    accent_theme: str | None = Field(None, max_length=20)


class WorkshopSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    address: str | None
    owner_contact: str | None
    whatsapp_number: str | None
    invoice_footer: str | None
    bank_details: str | None
    reminder_interval_days: int
    digest_enabled: bool
    accent_theme: str
    created_at: datetime
