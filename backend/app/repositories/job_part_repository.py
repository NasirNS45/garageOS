from decimal import Decimal

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_part import JobPart


class JobPartRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(
        self,
        job_card_id: str,
        name: str,
        quantity: Decimal,
        unit_price: Decimal,
    ) -> JobPart:
        line_total = float(quantity * unit_price)
        part = JobPart(
            job_card_id=job_card_id,
            name=name,
            quantity=float(quantity),
            unit_price=float(unit_price),
            line_total=line_total,
        )
        self._session.add(part)
        await self._session.flush()
        return part

    async def get_by_id(self, part_id: str, job_card_id: str) -> JobPart | None:
        result = await self._session.execute(
            select(JobPart).where(
                JobPart.id == part_id,
                JobPart.job_card_id == job_card_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_job(self, job_card_id: str) -> list[JobPart]:
        result = await self._session.execute(
            select(JobPart)
            .where(JobPart.job_card_id == job_card_id)
            .order_by(JobPart.created_at.asc())
        )
        return list(result.scalars().all())

    async def list_by_jobs(self, job_card_ids: list[str]) -> list[JobPart]:
        """Batch load parts for multiple job cards (avoids N+1)."""
        if not job_card_ids:
            return []
        result = await self._session.execute(
            select(JobPart)
            .where(JobPart.job_card_id.in_(job_card_ids))
            .order_by(JobPart.created_at.asc())
        )
        return list(result.scalars().all())

    async def update(
        self,
        part_id: str,
        job_card_id: str,
        name: str | None = None,
        quantity: Decimal | None = None,
        unit_price: Decimal | None = None,
    ) -> JobPart | None:
        """Update a part's fields and recompute line_total."""
        part = await self.get_by_id(part_id, job_card_id)
        if part is None:
            return None
        new_qty = float(quantity) if quantity is not None else part.quantity
        new_price = float(unit_price) if unit_price is not None else part.unit_price
        new_total = new_qty * new_price
        fields: dict[str, object] = {"line_total": new_total}
        if name is not None:
            fields["name"] = name
        if quantity is not None:
            fields["quantity"] = float(quantity)
        if unit_price is not None:
            fields["unit_price"] = float(unit_price)
        await self._session.execute(
            update(JobPart).where(
                JobPart.id == part_id,
                JobPart.job_card_id == job_card_id,
            ).values(**fields)
        )
        await self._session.flush()
        return await self.get_by_id(part_id, job_card_id)

    async def remove(self, part_id: str, job_card_id: str) -> bool:
        """Delete a part. Returns True if a row was deleted."""
        result = await self._session.execute(
            delete(JobPart).where(
                JobPart.id == part_id,
                JobPart.job_card_id == job_card_id,
            )
        )
        await self._session.flush()
        return result.rowcount > 0

    async def sum_for_job(self, job_card_id: str) -> float:
        """Return total of all line_total values for a job card."""
        result = await self._session.execute(
            select(func.coalesce(func.sum(JobPart.line_total), 0)).where(
                JobPart.job_card_id == job_card_id
            )
        )
        return float(result.scalar_one())
