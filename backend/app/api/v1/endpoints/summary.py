from datetime import date

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import Response

from app.core.dependencies import DbSession, OwnerClaims
from app.schemas.summary import (
    DailySeriesPoint,
    DailySummaryResponse,
    MechanicSummaryItem,
    RangeSummaryResponse,
)
from app.services.summary_service import SummaryService

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("/daily", response_model=DailySummaryResponse, status_code=status.HTTP_200_OK)
async def daily_summary(
    claims: OwnerClaims,
    session: DbSession,
    target_date: date | None = Query(default=None, description="ISO date (default: today)"),
) -> DailySummaryResponse:
    """Daily revenue and job summary (owner only)."""
    async with session.begin():
        return await SummaryService(session).daily(claims.workshop_id, target_date)


@router.get(
    "/range",
    response_model=RangeSummaryResponse,
    status_code=status.HTTP_200_OK,
)
async def range_summary(
    claims: OwnerClaims,
    session: DbSession,
    start_date: date = Query(..., description="Range start date (ISO)"),
    end_date: date = Query(..., description="Range end date (ISO)"),
) -> RangeSummaryResponse:
    """Revenue and job summary for an arbitrary date range (owner only)."""
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_date must be on or before end_date",
        )
    async with session.begin():
        return await SummaryService(session).range_summary(
            claims.workshop_id, start_date, end_date
        )


@router.get(
    "/mechanics",
    response_model=list[MechanicSummaryItem],
    status_code=status.HTTP_200_OK,
)
async def mechanic_summary(
    claims: OwnerClaims,
    session: DbSession,
    start_date: date = Query(..., description="Range start date (ISO)"),
    end_date: date = Query(..., description="Range end date (ISO)"),
) -> list[MechanicSummaryItem]:
    """Per-mechanic completed job count and revenue for a date range (owner only)."""
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_date must be on or before end_date",
        )
    async with session.begin():
        return await SummaryService(session).mechanic_summary(
            claims.workshop_id, start_date, end_date
        )


@router.get(
    "/daily-series",
    response_model=list[DailySeriesPoint],
    status_code=status.HTTP_200_OK,
)
async def daily_series(
    claims: OwnerClaims,
    session: DbSession,
    start_date: date = Query(..., description="Range start date (ISO)"),
    end_date: date = Query(..., description="Range end date (ISO)"),
) -> list[DailySeriesPoint]:
    """Per-day revenue, collected, and expenses for charting (owner only)."""
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_date must be on or before end_date",
        )
    if (end_date - start_date).days > 92:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Range too large (max 92 days)",
        )
    async with session.begin():
        return await SummaryService(session).daily_series(
            claims.workshop_id, start_date, end_date
        )


@router.get("/export", status_code=status.HTTP_200_OK, include_in_schema=True)
async def export_jobs_csv(
    claims: OwnerClaims,
    session: DbSession,
    start_date: date = Query(..., description="Export start date (ISO)"),
    end_date: date = Query(..., description="Export end date (ISO)"),
) -> Response:
    """Download completed jobs as a CSV file for a date range (owner only)."""
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_date must be on or before end_date",
        )
    async with session.begin():
        csv_content = await SummaryService(session).export_csv(
            claims.workshop_id, start_date, end_date
        )
    filename = f"jobs-{start_date}-to-{end_date}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
