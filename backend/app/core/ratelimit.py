"""Shared rate limiter instance.

Keyed by remote address. Disabled via RATE_LIMIT_ENABLED=false (tests).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings

limiter = Limiter(
    key_func=get_remote_address,
    enabled=get_settings().rate_limit_enabled,
)
