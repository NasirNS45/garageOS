import logging

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.core.config import get_settings as _get_settings
from app.core.dependencies import DbSession, OwnerClaims
from app.schemas.settings import (
    TestWhatsAppPayload,
    WorkshopSettingsResponse,
    WorkshopSettingsUpdate,
)
from app.services.settings_service import SettingsService
from app.services.whatsapp_service import WhatsAppService
from app.utils.mobile import normalize_mobile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=WorkshopSettingsResponse, status_code=status.HTTP_200_OK)
async def get_settings(claims: OwnerClaims, session: DbSession) -> WorkshopSettingsResponse:
    """Get workshop profile (owner only)."""
    async with session.begin():
        return await SettingsService(session).get(claims.workshop_id)


@router.put("", response_model=WorkshopSettingsResponse, status_code=status.HTTP_200_OK)
async def update_settings(
    payload: WorkshopSettingsUpdate, claims: OwnerClaims, session: DbSession
) -> WorkshopSettingsResponse:
    """Update workshop profile (owner only)."""
    async with session.begin():
        return await SettingsService(session).update(claims.workshop_id, payload)


@router.post("/test-whatsapp", status_code=status.HTTP_200_OK)
async def test_whatsapp(
    payload: TestWhatsAppPayload, claims: OwnerClaims
) -> JSONResponse:
    """Send a test WhatsApp message to verify Twilio credentials (owner only)."""
    settings = _get_settings()
    if not settings.whatsapp_enabled:
        return JSONResponse(
            status_code=400,
            content={
                "detail": (
                    "WhatsApp is not configured. "
                    "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file."
                )
            },
        )
    try:
        phone = normalize_mobile(payload.phone)
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    try:
        svc = WhatsAppService()
        await svc.send_message(
            phone,
            "GarageOS test message. WhatsApp notifications are working correctly!",
        )
        logger.info("WhatsApp test message sent", extra={"workshop_id": claims.workshop_id})
        return JSONResponse(content={"detail": "Test message sent successfully."})
    except Exception as exc:
        logger.error("WhatsApp test failed", extra={"error": str(exc)})
        return JSONResponse(
            status_code=502,
            content={"detail": f"Failed to send message: {exc}"},
        )
