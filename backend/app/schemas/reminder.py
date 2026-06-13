from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ReminderResponse(BaseModel):
    id: str
    customer_name: str
    customer_phone: str
    vehicle_number: str
    service_note: str | None
    due_date: date
    status: str
    created_at: datetime
    sent_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
