import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.pilot_analytics_repository import PilotAnalyticsRepository

logger = logging.getLogger(__name__)


class PilotAnalyticsService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = PilotAnalyticsRepository(session)
        self._session = session

    async def track(
        self,
        event_name: str,
        workshop_id: str | None = None,
        user_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        try:
            await self._repo.record(event_name, workshop_id, user_id, metadata)
        except Exception as exc:
            logger.warning(
                "Failed to record pilot event",
                extra={"event": event_name, "error": str(exc)},
            )

    async def workshop_summary(self, workshop_id: str) -> dict[str, int]:
        return await self._repo.summary(workshop_id)

    async def track_whatsapp_result(
        self,
        workshop_id: str,
        success: bool,
        message_type: str,
    ) -> None:
        await self.track(
            "whatsapp_sent" if success else "whatsapp_failed",
            workshop_id=workshop_id,
            metadata={"message_type": message_type},
        )
