from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_card import JobCard, JobStatus
from app.models.user import User, UserRole


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        workshop_id: str,
        mobile: str,
        password_hash: str,
        full_name: str,
        role: UserRole = UserRole.mechanic,
    ) -> User:
        user = User(
            workshop_id=workshop_id,
            mobile=mobile,
            password_hash=password_hash,
            full_name=full_name,
            role=role.value,
        )
        self._session.add(user)
        await self._session.flush()
        return user

    async def get_by_mobile(self, mobile: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.mobile == mobile, User.is_active.is_(True))
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: str, workshop_id: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.id == user_id, User.workshop_id == workshop_id)
        )
        return result.scalar_one_or_none()

    async def list_mechanics(self, workshop_id: str) -> list[User]:
        result = await self._session.execute(
            select(User).where(
                User.workshop_id == workshop_id,
                User.role == UserRole.mechanic.value,
                User.is_active.is_(True),
            )
        )
        return list(result.scalars().all())

    async def list_mechanics_with_availability(self, workshop_id: str) -> list[tuple[User, bool]]:
        """Return all mechanics (active and inactive) paired with an availability flag.

        A mechanic is unavailable when assigned as assigned_mechanic_id on a
        job card with status=in_progress in the same workshop.
        Active/inactive filtering is handled by the frontend.
        """
        result = await self._session.execute(
            select(User).where(
                User.workshop_id == workshop_id,
                User.role == UserRole.mechanic.value,
            )
        )
        mechanics = list(result.scalars().all())

        if not mechanics:
            return []

        busy_result = await self._session.execute(
            select(JobCard.assigned_mechanic_id).where(
                JobCard.workshop_id == workshop_id,
                JobCard.status == JobStatus.in_progress.value,
                JobCard.assigned_mechanic_id.is_not(None),
            )
        )
        busy_ids = {row[0] for row in busy_result.all()}
        return [(m, m.id not in busy_ids) for m in mechanics]

    async def set_active(self, user_id: str, workshop_id: str, is_active: bool) -> User | None:
        await self._session.execute(
            update(User)
            .where(User.id == user_id, User.workshop_id == workshop_id)
            .values(is_active=is_active)
        )
        await self._session.flush()
        return await self.get_by_id(user_id, workshop_id)

    async def mobile_exists(self, mobile: str) -> bool:
        result = await self._session.execute(select(User.id).where(User.mobile == mobile).limit(1))
        return result.scalar_one_or_none() is not None
