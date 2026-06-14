import hashlib
import secrets

from app.core.config import get_settings


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def hash_reset_token(token: str) -> str:
    settings = get_settings()
    return hashlib.sha256(f"{settings.secret_key}{token}".encode()).hexdigest()
