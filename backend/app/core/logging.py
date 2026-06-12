"""Structured logging with per-request correlation IDs."""

import json
import logging
import logging.config
from contextvars import ContextVar
from datetime import UTC, datetime

request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)

_STANDARD_ATTRS = frozenset(
    logging.LogRecord("", 0, "", 0, "", (), None).__dict__
) | {"message", "asctime", "taskName"}


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        return True


class JsonFormatter(logging.Formatter):
    """Single-line JSON log records, including any extra={} fields."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "timestamp": datetime.now(UTC).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        for key, value in record.__dict__.items():
            if key not in _STANDARD_ATTRS and key not in payload:
                payload[key] = value
        return json.dumps(payload, default=str)


def configure_logging(level: str, environment: str) -> None:
    """JSON logs in production, plain text in development."""
    formatter: dict[str, object] = (
        {"()": JsonFormatter}
        if environment == "production"
        else {"format": "%(asctime)s %(levelname)-8s [%(request_id)s] %(name)s: %(message)s"}
    )
    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "filters": {"request_id": {"()": RequestIdFilter}},
            "formatters": {"app": formatter},
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "app",
                    "filters": ["request_id"],
                }
            },
            "root": {"level": level, "handlers": ["console"]},
        }
    )
