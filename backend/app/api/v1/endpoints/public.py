from datetime import UTC

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select

from app.core.dependencies import DbSession
from app.models.job_card import JobCard, JobStatus
from app.models.job_part import JobPart
from app.models.workshop import Workshop
from app.schemas.public import (
    PublicInvoicePart,
    PublicInvoiceResponse,
    PublicTrackResponse,
)
from app.services.pdf_service import build_invoice_pdf
from app.utils.theme import brand_color_for_theme

# Public, unauthenticated data for the customer-facing invoice and tracking
# pages (rendered by the frontend). Job-card ids and invoice numbers are
# unguessable, so no auth is required.
router = APIRouter(prefix="/public", tags=["public"])


def _date(dt: object) -> str:
    return dt.astimezone(UTC).strftime("%d %b %Y") if dt else ""  # type: ignore[attr-defined]


@router.get(
    "/invoices/{invoice_number}",
    response_model=PublicInvoiceResponse,
    status_code=status.HTTP_200_OK,
)
async def public_invoice(invoice_number: str, session: DbSession) -> PublicInvoiceResponse:
    result = await session.execute(
        select(JobCard).where(
            JobCard.invoice_number == invoice_number,
            JobCard.status == JobStatus.completed.value,
        )
    )
    card = result.scalar_one_or_none()
    if card is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    ws_result = await session.execute(
        select(Workshop).where(Workshop.id == card.workshop_id)
    )
    workshop = ws_result.scalar_one_or_none()

    parts_result = await session.execute(
        select(JobPart).where(JobPart.job_card_id == card.id).order_by(JobPart.created_at)
    )
    parts = parts_result.scalars().all()

    return PublicInvoiceResponse(
        invoice_number=card.invoice_number or "",
        workshop_name=workshop.name if workshop else "Workshop",
        workshop_address=(workshop.address if workshop else "") or "",
        workshop_whatsapp=(workshop.whatsapp_number if workshop else "") or "",
        workshop_bank_details=(workshop.bank_details if workshop else "") or "",
        workshop_invoice_footer=(workshop.invoice_footer if workshop else "") or "",
        customer_name=card.customer_name,
        customer_phone=card.customer_phone,
        vehicle_number=card.vehicle_number,
        description=card.description or "",
        labour_charge=float(card.labour_charge),
        parts_charge=float(card.parts_charge),
        total_amount=float(card.total_amount),
        parts=[
            PublicInvoicePart(
                name=p.name,
                quantity=float(p.quantity),
                unit_price=float(p.unit_price),
                line_total=float(p.line_total),
            )
            for p in parts
        ],
        completed_at=_date(card.completed_at),
        brand_color=brand_color_for_theme(
            workshop.accent_theme if workshop else None
        ),
    )


@router.get(
    "/invoices/{invoice_number}/pdf",
    status_code=status.HTTP_200_OK,
    response_class=Response,
)
async def public_invoice_pdf(invoice_number: str, session: DbSession) -> Response:
    invoice = await public_invoice(invoice_number, session)
    pdf_bytes = build_invoice_pdf(invoice)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="invoice-{invoice_number}.pdf"'
        },
    )


@router.get(
    "/track/{card_id}",
    response_model=PublicTrackResponse,
    status_code=status.HTTP_200_OK,
)
async def public_track(card_id: str, session: DbSession) -> PublicTrackResponse:
    result = await session.execute(select(JobCard).where(JobCard.id == card_id))
    card = result.scalar_one_or_none()
    if card is None:
        raise HTTPException(status_code=404, detail="Job not found")

    ws_result = await session.execute(
        select(Workshop).where(Workshop.id == card.workshop_id)
    )
    workshop = ws_result.scalar_one_or_none()

    invoice_number = (
        card.invoice_number
        if card.status == JobStatus.completed.value and card.invoice_number
        else None
    )

    return PublicTrackResponse(
        workshop_name=workshop.name if workshop else "Workshop",
        vehicle_number=card.vehicle_number,
        vehicle_make=card.vehicle_make or "",
        status=card.status,
        description=card.description or "",
        labour_charge=float(card.labour_charge),
        parts_charge=float(card.parts_charge),
        total_amount=float(card.total_amount),
        created_at=_date(card.created_at),
        completed_at=_date(card.completed_at),
        invoice_number=invoice_number,
        brand_color=brand_color_for_theme(
            workshop.accent_theme if workshop else None
        ),
    )
