from pydantic import BaseModel


class PublicInvoicePart(BaseModel):
    name: str
    quantity: float
    unit_price: float
    line_total: float


class PublicInvoiceResponse(BaseModel):
    invoice_number: str
    workshop_name: str
    workshop_address: str
    workshop_whatsapp: str
    workshop_bank_details: str
    workshop_invoice_footer: str
    customer_name: str
    customer_phone: str
    vehicle_number: str
    description: str
    labour_charge: float
    parts_charge: float
    total_amount: float
    parts: list[PublicInvoicePart]
    completed_at: str
    brand_color: str


class PublicTrackResponse(BaseModel):
    workshop_name: str
    vehicle_number: str
    vehicle_make: str
    status: str
    description: str
    labour_charge: float
    parts_charge: float
    total_amount: float
    created_at: str
    completed_at: str
    invoice_number: str | None
    brand_color: str
