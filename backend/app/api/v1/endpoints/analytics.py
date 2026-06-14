from datetime import UTC, datetime

from fastapi import APIRouter, status

from app.core.dependencies import CurrentClaims, DbSession, OwnerClaims
from app.schemas.analytics import PilotEventCreate, PilotSummaryResponse
from app.services.pilot_analytics_service import PilotAnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/events", status_code=status.HTTP_204_NO_CONTENT)
async def track_event(
    payload: PilotEventCreate,
    claims: CurrentClaims,
    session: DbSession,
) -> None:
    """Record a pilot analytics event from the frontend."""
    async with session.begin():
        await PilotAnalyticsService(session).track(
            payload.event_name,
            workshop_id=claims.workshop_id,
            user_id=claims.user_id,
            metadata=payload.metadata,
        )


@router.get("/pilot-summary", response_model=PilotSummaryResponse, status_code=status.HTTP_200_OK)
async def pilot_summary(
    claims: OwnerClaims,
    session: DbSession,
) -> PilotSummaryResponse:
    """Owner-only pilot KPI summary for the current workshop."""
    async with session.begin():
        svc = PilotAnalyticsService(session)
        events = await svc.workshop_summary(claims.workshop_id)

    sent = events.get("whatsapp_sent", 0)
    failed = events.get("whatsapp_failed", 0)
    total_wa = sent + failed
    delivery_rate = round(sent / total_wa * 100, 1) if total_wa > 0 else None

    return PilotSummaryResponse(
        events=events,
        whatsapp_delivery_rate=delivery_rate,
    )
