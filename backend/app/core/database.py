from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def _make_engine() -> any:  # type: ignore[return]
    settings = get_settings()
    return create_async_engine(
        settings.database_url,
        echo=settings.environment == "development",
        pool_pre_ping=True,
        pool_size=20,
        max_overflow=10,
        pool_recycle=3600,  # recycle connections every hour to avoid stale handles
    )


_engine = _make_engine()
_async_session_factory = async_sessionmaker(_engine, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with _async_session_factory() as session:
        yield session


async def create_tables() -> None:
    """Used only in tests — production uses Alembic."""
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_tables() -> None:
    """Used only in tests."""
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
