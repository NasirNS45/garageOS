from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.password_reset_token import PasswordResetToken


class PasswordResetRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, user_id: str, token_hash: str, expires_at: datetime) -> PasswordResetToken:
        await self._session.execute(
            delete(PasswordResetToken).where(PasswordResetToken.user_id == user_id)
        )
        token = PasswordResetToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self._session.add(token)
        await self._session.flush()
        return token

    async def get_valid_by_hash(self, token_hash: str) -> PasswordResetToken | None:
        result = await self._session.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.expires_at > datetime.now(UTC),
            )
        )
        return result.scalar_one_or_none()

    async def delete_by_user(self, user_id: str) -> None:
        await self._session.execute(
            delete(PasswordResetToken).where(PasswordResetToken.user_id == user_id)
        )
