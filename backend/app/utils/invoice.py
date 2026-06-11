from datetime import UTC, datetime


def generate_invoice_number(workshop_id: str, sequence: int) -> str:
    """
    Generate a human-readable, unique invoice number.
    Format: INV-{workshop_short}-{YYYYMMDD}-{seq:04d}
    Example: INV-A1B2-20250610-0007
    """
    date_str = datetime.now(UTC).strftime("%Y%m%d")
    short_id = workshop_id.replace("-", "")[:8].upper()
    return f"INV-{short_id}-{date_str}-{sequence:04d}"
