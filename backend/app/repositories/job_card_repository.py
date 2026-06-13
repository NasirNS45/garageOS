from datetime import UTC, date, datetime

from sqlalchemy import and_, case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_card import JobCard, JobStatus, PaymentStatus
from app.models.user import User
from app.utils.sql import escape_like


class JobCardRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, workshop_id: str, **fields: object) -> JobCard:
        card = JobCard(workshop_id=workshop_id, **fields)
        self._session.add(card)
        await self._session.flush()
        return card

    async def get_by_id(self, card_id: str, workshop_id: str) -> JobCard | None:
        result = await self._session.execute(
            select(JobCard).where(
                JobCard.id == card_id,
                JobCard.workshop_id == workshop_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_active(
        self,
        workshop_id: str,
        page: int = 1,
        page_size: int = 20,
        mechanic_id: str | None = None,
    ) -> tuple[list[JobCard], int]:
        base_q = select(JobCard).where(
            JobCard.workshop_id == workshop_id,
            JobCard.status != JobStatus.cancelled.value,
        )
        if mechanic_id is not None:
            # Mechanics see: jobs assigned to them + unassigned pending jobs
            base_q = base_q.where(
                or_(
                    JobCard.assigned_mechanic_id == mechanic_id,
                    and_(
                        JobCard.assigned_mechanic_id.is_(None),
                        JobCard.status == JobStatus.pending.value,
                    ),
                )
            )
        count_result = await self._session.execute(
            select(func.count()).select_from(base_q.subquery())
        )
        total = count_result.scalar_one()
        offset = (page - 1) * page_size
        result = await self._session.execute(
            base_q.order_by(JobCard.created_at.desc()).offset(offset).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def update(self, card_id: str, workshop_id: str, **fields: object) -> JobCard | None:
        if fields:
            await self._session.execute(
                update(JobCard)
                .where(JobCard.id == card_id, JobCard.workshop_id == workshop_id)
                .values(**fields)
            )
            await self._session.flush()
        return await self.get_by_id(card_id, workshop_id)

    async def complete(
        self,
        card_id: str,
        workshop_id: str,
        invoice_number: str,
        total_amount: float,
    ) -> JobCard | None:
        await self._session.execute(
            update(JobCard)
            .where(JobCard.id == card_id, JobCard.workshop_id == workshop_id)
            .values(
                status=JobStatus.completed.value,
                invoice_number=invoice_number,
                total_amount=total_amount,
                completed_at=datetime.now(UTC),
            )
        )
        await self._session.flush()
        return await self.get_by_id(card_id, workshop_id)

    async def count_today_invoices(self, workshop_id: str) -> int:
        today = date.today()
        result = await self._session.execute(
            select(func.count(JobCard.id)).where(
                JobCard.workshop_id == workshop_id,
                JobCard.invoice_number.is_not(None),
                func.date(JobCard.completed_at) == today,
            )
        )
        return result.scalar_one()

    async def get_by_vehicle(self, workshop_id: str, vehicle_number: str) -> list[JobCard]:
        result = await self._session.execute(
            select(JobCard)
            .where(
                JobCard.workshop_id == workshop_id,
                JobCard.vehicle_number.ilike(f"%{escape_like(vehicle_number)}%", escape="\\"),
            )
            .order_by(JobCard.created_at.desc())
            .limit(50)
        )
        return list(result.scalars().all())

    async def get_by_phone(self, workshop_id: str, phone: str) -> list[JobCard]:
        result = await self._session.execute(
            select(JobCard)
            .where(
                JobCard.workshop_id == workshop_id,
                JobCard.customer_phone == phone,
            )
            .order_by(JobCard.created_at.desc())
            .limit(50)
        )
        return list(result.scalars().all())

    async def top_customers(
        self, workshop_id: str, limit: int = 20
    ) -> list[dict[str, object]]:
        """Customers ranked by total completed spend, with visit count and last visit."""
        completed_spend = func.coalesce(
            func.sum(
                case(
                    (JobCard.status == JobStatus.completed.value, JobCard.total_amount),
                    else_=0,
                )
            ),
            0,
        )
        result = await self._session.execute(
            select(
                JobCard.customer_phone.label("customer_phone"),
                func.max(JobCard.customer_name).label("customer_name"),
                func.count(JobCard.id).label("total_jobs"),
                completed_spend.label("total_spent"),
                func.max(JobCard.created_at).label("last_visit"),
            )
            .where(
                JobCard.workshop_id == workshop_id,
                JobCard.customer_phone.is_not(None),
                JobCard.customer_phone != "",
            )
            .group_by(JobCard.customer_phone)
            .order_by(completed_spend.desc(), func.count(JobCard.id).desc())
            .limit(limit)
        )
        return [
            {
                "customer_phone": row.customer_phone,
                "customer_name": row.customer_name,
                "total_jobs": int(row.total_jobs or 0),
                "total_spent": float(row.total_spent or 0),
                "last_visit": row.last_visit,
            }
            for row in result.all()
        ]

    async def daily_summary(self, workshop_id: str, target_date: date) -> dict[str, object]:
        # Active jobs: current shop-floor state, no date filter.
        active_result = await self._session.execute(
            select(
                func.sum(case((JobCard.status == JobStatus.pending.value, 1), else_=0)).label(
                    "pending_jobs"
                ),
                func.sum(case((JobCard.status == JobStatus.in_progress.value, 1), else_=0)).label(
                    "in_progress_jobs"
                ),
            ).where(
                JobCard.workshop_id == workshop_id,
                JobCard.status.in_([JobStatus.pending.value, JobStatus.in_progress.value]),
            )
        )
        active_row = active_result.one()

        # Completed today: filtered by completed_at so revenue is attributed to the
        # day the job actually finished, not the day it was opened.
        completed_result = await self._session.execute(
            select(
                func.count(JobCard.id).label("completed_jobs"),
                func.coalesce(func.sum(JobCard.total_amount), 0).label("total_revenue"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                JobCard.payment_status == PaymentStatus.paid.value,
                                JobCard.total_amount,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("total_collected"),
            ).where(
                JobCard.workshop_id == workshop_id,
                JobCard.status == JobStatus.completed.value,
                func.date(JobCard.completed_at) == target_date,
            )
        )
        completed_row = completed_result.one()

        pending = int(active_row.pending_jobs or 0)
        in_progress = int(active_row.in_progress_jobs or 0)
        completed = int(completed_row.completed_jobs or 0)

        return {
            "total_jobs": pending + in_progress + completed,
            "completed_jobs": completed,
            "pending_jobs": pending,
            "in_progress_jobs": in_progress,
            "total_revenue": float(completed_row.total_revenue or 0),
            "total_collected": float(completed_row.total_collected or 0),
        }

    async def list_completed_in_range(
        self, workshop_id: str, start_date: date, end_date: date
    ) -> list[dict[str, object]]:
        """Return completed jobs in a range joined with mechanic name for CSV export."""
        result = await self._session.execute(
            select(
                JobCard.invoice_number,
                JobCard.completed_at,
                JobCard.vehicle_number,
                JobCard.vehicle_make,
                JobCard.customer_name,
                JobCard.customer_phone,
                JobCard.description,
                JobCard.labour_charge,
                JobCard.parts_charge,
                JobCard.total_amount,
                JobCard.payment_status,
                User.full_name.label("mechanic_name"),
            )
            .outerjoin(User, User.id == JobCard.assigned_mechanic_id)
            .where(
                JobCard.workshop_id == workshop_id,
                JobCard.status == JobStatus.completed.value,
                func.date(JobCard.completed_at) >= start_date,
                func.date(JobCard.completed_at) <= end_date,
            )
            .order_by(JobCard.completed_at.desc())
        )
        return [
            {
                "invoice_number": row.invoice_number or "",
                "date": row.completed_at.date().isoformat() if row.completed_at else "",
                "vehicle_number": row.vehicle_number,
                "vehicle_make": row.vehicle_make or "",
                "customer_name": row.customer_name,
                "customer_phone": row.customer_phone,
                "description": row.description or "",
                "labour_charge": float(row.labour_charge),
                "parts_charge": float(row.parts_charge),
                "total_amount": float(row.total_amount),
                "payment_status": row.payment_status,
                "mechanic": row.mechanic_name or "",
            }
            for row in result.all()
        ]

    async def range_summary(
        self, workshop_id: str, start_date: date, end_date: date
    ) -> dict[str, object]:
        """Aggregate stats for a date range (by completed_at). Active jobs are current."""
        active_result = await self._session.execute(
            select(
                func.sum(
                    case((JobCard.status == JobStatus.pending.value, 1), else_=0)
                ).label("pending_jobs"),
                func.sum(
                    case((JobCard.status == JobStatus.in_progress.value, 1), else_=0)
                ).label("in_progress_jobs"),
            ).where(
                JobCard.workshop_id == workshop_id,
                JobCard.status.in_(
                    [JobStatus.pending.value, JobStatus.in_progress.value]
                ),
            )
        )
        active_row = active_result.one()

        completed_result = await self._session.execute(
            select(
                func.count(JobCard.id).label("completed_jobs"),
                func.coalesce(func.sum(JobCard.total_amount), 0).label("total_revenue"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                JobCard.payment_status == PaymentStatus.paid.value,
                                JobCard.total_amount,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("total_collected"),
            ).where(
                JobCard.workshop_id == workshop_id,
                JobCard.status == JobStatus.completed.value,
                func.date(JobCard.completed_at) >= start_date,
                func.date(JobCard.completed_at) <= end_date,
            )
        )
        completed_row = completed_result.one()

        pending = int(active_row.pending_jobs or 0)
        in_progress = int(active_row.in_progress_jobs or 0)
        completed = int(completed_row.completed_jobs or 0)

        return {
            "total_jobs": pending + in_progress + completed,
            "completed_jobs": completed,
            "pending_jobs": pending,
            "in_progress_jobs": in_progress,
            "total_revenue": float(completed_row.total_revenue or 0),
            "total_collected": float(completed_row.total_collected or 0),
        }

    async def revenue_by_day(
        self, workshop_id: str, start_date: date, end_date: date
    ) -> dict[str, dict[str, float]]:
        """Map of ISO date -> {revenue, collected} for completed jobs per day."""
        day = func.date(JobCard.completed_at)
        result = await self._session.execute(
            select(
                day.label("day"),
                func.coalesce(func.sum(JobCard.total_amount), 0).label("revenue"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                JobCard.payment_status == PaymentStatus.paid.value,
                                JobCard.total_amount,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("collected"),
            )
            .where(
                JobCard.workshop_id == workshop_id,
                JobCard.status == JobStatus.completed.value,
                day >= start_date,
                day <= end_date,
            )
            .group_by(day)
        )
        return {
            str(row.day): {
                "revenue": float(row.revenue or 0),
                "collected": float(row.collected or 0),
            }
            for row in result.all()
        }

    async def mechanic_summary(
        self, workshop_id: str, start_date: date, end_date: date
    ) -> list[dict[str, object]]:
        """Per-mechanic completed job count and revenue for a date range."""
        result = await self._session.execute(
            select(
                JobCard.assigned_mechanic_id,
                User.full_name,
                func.count(JobCard.id).label("completed_jobs"),
                func.coalesce(func.sum(JobCard.labour_charge), 0).label("total_labour"),
                func.coalesce(func.sum(JobCard.total_amount), 0).label("total_revenue"),
            )
            .join(User, User.id == JobCard.assigned_mechanic_id)
            .where(
                JobCard.workshop_id == workshop_id,
                JobCard.status == JobStatus.completed.value,
                func.date(JobCard.completed_at) >= start_date,
                func.date(JobCard.completed_at) <= end_date,
                JobCard.assigned_mechanic_id.is_not(None),
            )
            .group_by(JobCard.assigned_mechanic_id, User.full_name)
            .order_by(func.count(JobCard.id).desc())
        )
        return [
            {
                "mechanic_id": row.assigned_mechanic_id,
                "full_name": row.full_name,
                "completed_jobs": int(row.completed_jobs),
                "total_labour": float(row.total_labour or 0),
                "total_revenue": float(row.total_revenue or 0),
            }
            for row in result.all()
        ]
