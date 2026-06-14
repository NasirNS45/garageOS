import asyncio
import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_MAX_ATTEMPTS = 3


class WhatsAppService:
    """WhatsApp adapter — Twilio (production or sandbox) or Meta Cloud API."""

    async def send_message(self, to: str, body: str) -> bool:
        """Best-effort send with retries. Returns True if delivered. Never raises."""
        settings = get_settings()
        if not settings.whatsapp_enabled:
            logger.warning("WhatsApp not configured; message not sent", extra={"to": to})
            return False

        if settings.whatsapp_provider == "meta":
            return await self._send_via_meta(to, body)
        return await self._send_via_twilio(to, body)

    async def _send_via_twilio(self, to: str, body: str) -> bool:
        settings = get_settings()
        to_wa = to if to.startswith("whatsapp:") else f"whatsapp:{to}"
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"
        last_error = "unknown"

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
                if response.status_code < 400:
                    logger.info("WhatsApp message sent via Twilio", extra={"to": to})
                    return True
                if response.status_code < 500:
                    logger.error(
                        "WhatsApp send rejected by Twilio",
                        extra={"status": response.status_code, "body": response.text[:200]},
                    )
                    return False
                last_error = f"HTTP {response.status_code}"
            except httpx.HTTPError as exc:
                last_error = str(exc)

            if attempt < _MAX_ATTEMPTS - 1:
                logger.warning(
                    "Twilio WhatsApp send failed, retrying",
                    extra={"attempt": attempt + 1, "error": last_error},
                )
                await asyncio.sleep(2**attempt)

        logger.error(
            "Twilio WhatsApp send failed after retries",
            extra={"attempts": _MAX_ATTEMPTS, "error": last_error},
        )
        return False

    async def _send_via_meta(self, to: str, body: str) -> bool:
        settings = get_settings()
        phone = to.removeprefix("whatsapp:")
        url = f"https://graph.facebook.com/v21.0/{settings.meta_whatsapp_phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {settings.meta_whatsapp_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": phone.lstrip("+"),
            "type": "text",
            "text": {"body": body},
        }
        last_error = "unknown"

        for attempt in range(_MAX_ATTEMPTS):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.post(url, json=payload, headers=headers)
                if response.status_code < 400:
                    logger.info("WhatsApp message sent via Meta", extra={"to": to})
                    return True
                if response.status_code < 500:
                    logger.error(
                        "WhatsApp send rejected by Meta",
                        extra={"status": response.status_code, "body": response.text[:200]},
                    )
                    return False
                last_error = f"HTTP {response.status_code}"
            except httpx.HTTPError as exc:
                last_error = str(exc)

            if attempt < _MAX_ATTEMPTS - 1:
                logger.warning(
                    "Meta WhatsApp send failed, retrying",
                    extra={"attempt": attempt + 1, "error": last_error},
                )
                await asyncio.sleep(2**attempt)

        logger.error(
            "Meta WhatsApp send failed after retries",
            extra={"attempts": _MAX_ATTEMPTS, "error": last_error},
        )
        return False

    async def send_checkin_notification(
        self,
        customer_phone: str,
        customer_name: str,
        vehicle_number: str,
        workshop_name: str,
        track_url: str | None = None,
        urdu: bool = False,
    ) -> bool:
        if urdu:
            track_line = f"گاڑی ٹریک کریں: {track_url}\n\n" if track_url else ""
            body = (
                f"السلام علیکم {customer_name}!\n\n"
                f"آپ کی گاڑی *{vehicle_number}* {workshop_name} میں موصول ہو گئی ہے۔\n"
                f"تیار ہونے پر آپ کو اطلاع دی جائے گی۔\n\n"
                f"{track_line}"
                f"شکریہ!"
            )
        else:
            track_line = f"Track your vehicle: {track_url}\n\n" if track_url else ""
            body = (
                f"Assalam o Alaikum {customer_name}!\n\n"
                f"Your vehicle *{vehicle_number}* has been received at {workshop_name}.\n"
                f"We'll notify you when it's ready for pickup.\n\n"
                f"{track_line}"
                f"Thank you!"
            )
        return await self.send_message(customer_phone, body)

    async def send_completion_notification(
        self,
        customer_phone: str,
        customer_name: str,
        vehicle_number: str,
        invoice_number: str,
        total_amount: float,
        invoice_url: str,
        urdu: bool = False,
    ) -> bool:
        if urdu:
            body = (
                f"السلام علیکم {customer_name}!\n\n"
                f"آپ کی گاڑی *{vehicle_number}* اٹھانے کے لیے تیار ہے۔\n"
                f"انوائس: *{invoice_number}*\n"
                f"کل رقم: *PKR {total_amount:,.0f}*\n\n"
                f"انوائس دیکھیں: {invoice_url}\n\n"
                f"شکریہ!"
            )
        else:
            body = (
                f"Assalam o Alaikum {customer_name}!\n\n"
                f"Your vehicle *{vehicle_number}* is ready for pickup.\n"
                f"Invoice: *{invoice_number}*\n"
                f"Total: *PKR {total_amount:,.0f}*\n\n"
                f"View invoice: {invoice_url}\n\n"
                f"Thank you for choosing us!"
            )
        return await self.send_message(customer_phone, body)

    async def send_password_reset(self, user_phone: str, user_name: str, reset_url: str) -> bool:
        body = (
            f"Assalam o Alaikum {user_name}!\n\n"
            f"Reset your GarageOS password using this link (valid for 1 hour):\n"
            f"{reset_url}\n\n"
            f"If you did not request this, ignore this message."
        )
        return await self.send_message(user_phone, body)

    async def send_service_reminder(
        self,
        customer_phone: str,
        customer_name: str,
        vehicle_number: str,
        workshop_name: str,
    ) -> bool:
        body = (
            f"Assalam o Alaikum {customer_name}!\n\n"
            f"Your vehicle *{vehicle_number}* may be due for its next service.\n"
            f"Reply to this message or call us to book an appointment at {workshop_name}.\n\n"
            f"Thank you!"
        )
        return await self.send_message(customer_phone, body)

    async def send_daily_digest(
        self,
        owner_phone: str,
        workshop_name: str,
        summary_date: str,
        completed_jobs: int,
        total_jobs: int,
        total_revenue: float,
        total_collected: float,
    ) -> bool:
        outstanding = total_revenue - total_collected
        body = (
            f"*{workshop_name}* daily summary ({summary_date})\n\n"
            f"Jobs completed: {completed_jobs} of {total_jobs}\n"
            f"Revenue: PKR {total_revenue:,.0f}\n"
            f"Collected: PKR {total_collected:,.0f}\n"
            f"Outstanding: PKR {outstanding:,.0f}\n\n"
            f"Sent by GarageOS."
        )
        return await self.send_message(owner_phone, body)
