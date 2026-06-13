"""In-process scheduled jobs (APScheduler): service reminders + owner digest.

Note: runs inside the API process. With multiple workers, each worker would
schedule its own jobs; run a single worker for the scheduler, or move to an
external trigger, if you scale out.
"""

import logging
from datetime import UTC, date, datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import get_settings
from app.core.database import session_scope
from app.models.service_reminder import ReminderStatus
from app.repositories.reminder_repository import ReminderRepository
from app.repositories.workshop_repository import WorkshopRepository
from app.services.summary_service import SummaryService
from app.services.whatsapp_service import WhatsAppService

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def run_due_reminders() -> None:
    """Send WhatsApp service reminders that are due today, then mark them sent."""
    settings = get_settings()
    if not settings.whatsapp_enabled:
        logger.info("Reminder job skipped: WhatsApp not configured")
        return
    try:
        async with session_scope() as session:
            reminders = ReminderRepository(session)
            workshops = WorkshopRepository(session)
            wa = WhatsAppService()
            due = await reminders.list_due(date.today())
            ws_cache: dict[str, object] = {}
            sent = 0
            for r in due:
                ws = ws_cache.get(r.workshop_id)
                if ws is None:
                    ws = await workshops.get_by_id(r.workshop_id)
                    ws_cache[r.workshop_id] = ws
                name = ws.name if ws else "our workshop"  # type: ignore[attr-defined]
                await wa.send_service_reminder(
                    r.customer_phone, r.customer_name, r.vehicle_number, name
                )
                r.status = ReminderStatus.sent.value
                r.sent_at = datetime.now(UTC)
                sent += 1
            await session.commit()
        logger.info("Reminder job complete", extra={"sent": sent})
    except Exception:
        logger.exception("Reminder job failed")


async def run_daily_digests() -> None:
    """Send each opted-in owner a WhatsApp summary of the day."""
    settings = get_settings()
    if not settings.whatsapp_enabled:
        logger.info("Digest job skipped: WhatsApp not configured")
        return
    try:
        async with session_scope() as session:
            workshops = WorkshopRepository(session)
            summary_svc = SummaryService(session)
            wa = WhatsAppService()
            today = date.today()
            sent = 0
            for ws in await workshops.list_digest_enabled():
                phone = ws.whatsapp_number or ws.owner_contact
                if not phone:
                    continue
                s = await summary_svc.daily(ws.id, today)
                await wa.send_daily_digest(
                    owner_phone=phone,
                    workshop_name=ws.name,
                    summary_date=str(today),
                    completed_jobs=s.completed_jobs,
                    total_jobs=s.total_jobs,
                    total_revenue=s.total_revenue,
                    total_collected=s.total_collected,
                )
                sent += 1
        logger.info("Digest job complete", extra={"sent": sent})
    except Exception:
        logger.exception("Digest job failed")


def start_scheduler() -> None:
    settings = get_settings()
    if not settings.scheduler_enabled:
        logger.info("Scheduler disabled")
        return
    scheduler.add_job(
        run_due_reminders,
        "cron",
        hour=settings.reminder_send_hour,
        minute=0,
        id="due_reminders",
        replace_existing=True,
    )
    scheduler.add_job(
        run_daily_digests,
        "cron",
        hour=settings.digest_send_hour,
        minute=0,
        id="daily_digests",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "Scheduler started",
        extra={
            "reminder_hour": settings.reminder_send_hour,
            "digest_hour": settings.digest_send_hour,
        },
    )


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
