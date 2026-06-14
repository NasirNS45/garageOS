import logging

from app.core.config import get_settings
from app.utils.invoice import generate_invoice_number

logger = logging.getLogger(__name__)


class InvoiceService:
    def make_invoice_number(self, workshop_id: str, sequence: int) -> str:
        return generate_invoice_number(workshop_id, sequence)

    def invoice_url(self, invoice_number: str) -> str:
        base = get_settings().web_base_url.rstrip("/")
        return f"{base}/invoices/{invoice_number}"

    def track_url(self, card_id: str) -> str:
        base = get_settings().web_base_url.rstrip("/")
        return f"{base}/track/{card_id}"
