from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def _make_engine() -> AsyncEngine:
    settings = get_settings()
    kwargs: dict[str, Any] = {
        "echo": settings.environment == "development",
        "pool_pre_ping": True,
    }
    # SQLite (tests) uses StaticPool and rejects sizing options
    if not settings.database_url.startswith("sqlite"):
        kwargs.update(
            pool_size=20,
            max_overflow=10,
            pool_recycle=3600,  # recycle connections every hour to avoid stale handles
        )
    return create_async_engine(settings.database_url, **kwargs)


_engine = _make_engine()
_async_session_factory = async_sessionmaker(_engine, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with _async_session_factory() as session:
        yield session


@asynccontextmanager
async def session_scope() -> AsyncGenerator[AsyncSession, None]:
    """Standalone session for background jobs (outside the request lifecycle)."""
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
