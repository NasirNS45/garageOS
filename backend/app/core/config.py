from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    database_url: str = Field(..., description="Async PostgreSQL DSN")

    # JWT
    secret_key: str = Field(
        ...,
        min_length=32,
        description="Secret key for JWT signing (generate with: openssl rand -hex 32)",
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Rate limiting (disabled in tests)
    rate_limit_enabled: bool = True

    # Twilio WhatsApp (optional — disabled if SID is blank)
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_from: str = "whatsapp:+14155238886"

    # App
    environment: str = "development"
    log_level: str = "INFO"
    app_base_url: str = "http://localhost:8000"
    cors_origins: str = "*"  # comma-separated in production, e.g. "https://myworkshop.com"

    # Background scheduler (APScheduler) — disabled in tests
    scheduler_enabled: bool = True
    reminder_send_hour: int = 9   # local hour to dispatch due service reminders
    digest_send_hour: int = 20    # local hour to send the owner daily digest

    # Object storage for photos (S3-compatible, e.g. Cloudflare R2)
    storage_endpoint_url: str = ""
    storage_access_key: str = ""
    storage_secret_key: str = ""
    storage_bucket: str = ""
    storage_public_url: str = ""  # public base URL for stored objects
    storage_region: str = "auto"

    @property
    def whatsapp_enabled(self) -> bool:
        return bool(self.twilio_account_sid and self.twilio_auth_token)

    @property
    def storage_enabled(self) -> bool:
        return bool(
            self.storage_endpoint_url
            and self.storage_access_key
            and self.storage_secret_key
            and self.storage_bucket
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
