import json
import logging
import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pilot_event import PilotEvent

logger = logging.getLogger(__name__)


class PilotAnalyticsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def record(
        self,
        event_name: str,
        workshop_id: str | None = None,
        user_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        event = PilotEvent(
            id=str(uuid.uuid4()),
            workshop_id=workshop_id,
            user_id=user_id,
            event_name=event_name,
            metadata_json=json.dumps(metadata) if metadata else None,
        )
        self._session.add(event)

    async def count_by_name(self, workshop_id: str, event_name: str) -> int:
        result = await self._session.execute(
            select(func.count(PilotEvent.id)).where(
                PilotEvent.workshop_id == workshop_id,
                PilotEvent.event_name == event_name,
            )
        )
        return int(result.scalar_one() or 0)

    async def summary(self, workshop_id: str) -> dict[str, int]:
        result = await self._session.execute(
            select(PilotEvent.event_name, func.count(PilotEvent.id))
            .where(PilotEvent.workshop_id == workshop_id)
            .group_by(PilotEvent.event_name)
        )
        return {row[0]: int(row[1]) for row in result.all()}
