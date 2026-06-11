from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workshop import Workshop


class WorkshopRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        name: str,
        address: str | None,
        owner_contact: str | None,
        whatsapp_number: str | None,
    ) -> Workshop:
        workshop = Workshop(
            name=name,
            address=address,
            owner_contact=owner_contact,
            whatsapp_number=whatsapp_number,
        )
        self._session.add(workshop)
        await self._session.flush()
        return workshop

    async def get_by_id(self, workshop_id: str) -> Workshop | None:
        result = await self._session.execute(select(Workshop).where(Workshop.id == workshop_id))
        return result.scalar_one_or_none()

    async def update(self, workshop_id: str, **fields: object) -> Workshop | None:
        filtered = {k: v for k, v in fields.items() if v is not None}
        if not filtered:
            return await self.get_by_id(workshop_id)
        await self._session.execute(
            update(Workshop).where(Workshop.id == workshop_id).values(**filtered)
        )
        await self._session.flush()
        return await self.get_by_id(workshop_id)
