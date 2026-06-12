import logging
import uuid
from contextlib import asynccontextmanager
from datetime import UTC
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from slowapi.errors import RateLimitExceeded
from sqlalchemy import select, text

from app.api.v1.router import v1_router
from app.core.config import get_settings
from app.core.database import get_session
from app.core.exceptions import AppException
from app.core.logging import configure_logging, request_id_var
from app.core.ratelimit import limiter
from app.models.job_card import JobCard, JobStatus
from app.models.job_part import JobPart
from app.models.workshop import Workshop

logger = logging.getLogger(__name__)

_TEMPLATES = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    settings = get_settings()
    configure_logging(settings.log_level, settings.environment)
    logger.info("GarageOS starting", extra={"env": settings.environment})
    yield
    logger.info("GarageOS shutting down")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="GarageOS API",
        version="0.1.0",
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    # Rate limiting (slowapi)
    app.state.limiter = limiter

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many attempts. Please try again in a minute."},
        )

    # Request ID + security headers
    @app.middleware("http")
    async def request_context_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:16]
        token = request_id_var.set(request_id)
        try:
            response = await call_next(request)
        finally:
            request_id_var.reset(token)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response

    # Exception handler for all domain exceptions
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    # Normalize Pydantic validation errors into our standard shape
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors()},
        )

    # Catch-all for unexpected server errors — log internally, return generic message
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "Unhandled exception",
            extra={"path": request.url.path, "method": request.method},
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected error occurred. Please try again later."},
        )

    # CORS — adjust origins for production
    from fastapi.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins.split(",") if settings.cors_origins != "*" else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(v1_router)

    # Public invoice route (no auth required)
    @app.get(
        "/invoices/{invoice_number}",
        response_class=HTMLResponse,
        include_in_schema=False,
    )
    async def render_invoice(request: Request, invoice_number: str) -> HTMLResponse:
        async for session in get_session():
            result = await session.execute(
                select(JobCard).where(
                    JobCard.invoice_number == invoice_number,
                    JobCard.status == JobStatus.completed.value,
                )
            )
            card = result.scalar_one_or_none()
            if card is None:
                return HTMLResponse("<h2>Invoice not found</h2>", status_code=404)

            ws_result = await session.execute(
                select(Workshop).where(Workshop.id == card.workshop_id)
            )
            workshop = ws_result.scalar_one_or_none()

            parts_result = await session.execute(
                select(JobPart)
                .where(JobPart.job_card_id == card.id)
                .order_by(JobPart.created_at)
            )
            parts = parts_result.scalars().all()

        completed_str = (
            card.completed_at.astimezone(UTC).strftime("%d %b %Y")
            if card.completed_at
            else "N/A"
        )

        parts_data = [
            {
                "name": p.name,
                "quantity": float(p.quantity),
                "unit_price": float(p.unit_price),
                "line_total": float(p.line_total),
            }
            for p in parts
        ]

        return _TEMPLATES.TemplateResponse(
            request,
            "invoice.html",
            {
                "invoice_number": card.invoice_number,
                "workshop_name": workshop.name if workshop else "Workshop",
                "workshop_address": workshop.address if workshop else "",
                "workshop_whatsapp": workshop.whatsapp_number if workshop else "",
                "workshop_bank_details": workshop.bank_details if workshop else "",
                "workshop_invoice_footer": workshop.invoice_footer if workshop else "",
                "customer_name": card.customer_name,
                "customer_phone": card.customer_phone,
                "vehicle_number": card.vehicle_number,
                "description": card.description or "",
                "labour_charge": float(card.labour_charge),
                "parts_charge": float(card.parts_charge),
                "total_amount": float(card.total_amount),
                "parts": parts_data,
                "completed_at": completed_str,
            },
        )

    @app.get("/health", include_in_schema=False)
    async def health() -> dict[str, str]:
        try:
            async for session in get_session():
                await session.execute(text("SELECT 1"))
            return {"status": "ok", "database": "ok"}
        except Exception:
            logger.exception("Health check database ping failed")
            return JSONResponse(  # type: ignore[return-value]
                status_code=503,
                content={"status": "degraded", "database": "unreachable"},
            )

    return app


app = create_app()
