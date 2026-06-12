import asyncio
import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_MAX_ATTEMPTS = 3


class WhatsAppService:
    """Adapter for Twilio WhatsApp sandbox (v1). Swap for Meta BSP in v2."""

    async def send_message(self, to: str, body: str) -> None:
        """Best-effort send with retries. Never raises into the request path."""
        settings = get_settings()
        if not settings.whatsapp_enabled:
            logger.warning("WhatsApp not configured; message not sent", extra={"to": to})
            return

        # Ensure E.164 format prefixed with whatsapp:
        to_wa = to if to.startswith("whatsapp:") else f"whatsapp:{to}"
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"

        for attempt in range(_MAX_ATTEMPTS):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(
                        url,
                        data={
                            "From": settings.twilio_whatsapp_from,
                            "To": to_wa,
                            "Body": body,
                        },
                        auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                    )
                # 4xx is a permanent failure (bad number, auth) — retrying won't help
                if response.status_code < 400:
                    logger.info("WhatsApp message sent", extra={"to": to})
                    return
                if response.status_code < 500:
                    logger.error(
                        "WhatsApp send rejected",
                        extra={"status": response.status_code, "body": response.text[:200]},
                    )
                    return
                last_error = f"HTTP {response.status_code}"
            except httpx.HTTPError as exc:
                last_error = str(exc)

            if attempt < _MAX_ATTEMPTS - 1:
                logger.warning(
                    "WhatsApp send failed, retrying",
                    extra={"attempt": attempt + 1, "error": last_error},
                )
                await asyncio.sleep(2**attempt)

        logger.error(
            "WhatsApp send failed after retries",
            extra={"attempts": _MAX_ATTEMPTS, "error": last_error},
        )

    async def send_checkin_notification(
        self,
        customer_phone: str,
        customer_name: str,
        vehicle_number: str,
        workshop_name: str,
    ) -> None:
        body = (
            f"Assalam o Alaikum {customer_name}!\n\n"
            f"Your vehicle *{vehicle_number}* has been received at {workshop_name}.\n"
            f"We'll notify you when it's ready for pickup.\n\n"
            f"Thank you!"
        )
        await self.send_message(customer_phone, body)

    async def send_completion_notification(
        self,
        customer_phone: str,
        customer_name: str,
        vehicle_number: str,
        invoice_number: str,
        total_amount: float,
        invoice_url: str,
    ) -> None:
        body = (
            f"Assalam o Alaikum {customer_name}!\n\n"
            f"Your vehicle *{vehicle_number}* is ready for pickup.\n"
            f"Invoice: *{invoice_number}*\n"
            f"Total: *PKR {total_amount:,.0f}*\n\n"
            f"View invoice: {invoice_url}\n\n"
            f"Thank you for choosing us!"
        )
        await self.send_message(customer_phone, body)
