import asyncio
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings


def _hash_password_sync(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def _verify_password_sync(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


async def hash_password(plain: str) -> str:
    # bcrypt is CPU-bound (~100ms+); keep it off the event loop
    return await asyncio.to_thread(_hash_password_sync, plain)


async def verify_password(plain: str, hashed: str) -> bool:
    return await asyncio.to_thread(_verify_password_sync, plain, hashed)


def _build_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    settings = get_settings()
    payload = data.copy()
    payload["exp"] = datetime.now(UTC) + expires_delta
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(user_id: str, workshop_id: str, role: str) -> str:
    settings = get_settings()
    return _build_token(
        {"sub": user_id, "workshop_id": workshop_id, "role": role, "type": "access"},
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(user_id: str) -> str:
    settings = get_settings()
    return _build_token(
        {"sub": user_id, "type": "refresh"},
        timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT. Raises JWTError on failure."""
    settings = get_settings()
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "JWTError",
]
