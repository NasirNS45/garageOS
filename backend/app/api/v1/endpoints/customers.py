from fastapi import APIRouter, Query, status

from app.core.dependencies import CurrentClaims, DbSession
from app.schemas.customer import CustomerHistoryResponse, OutstandingCustomerItem, TopCustomerItem
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get(
    "/insights",
    response_model=list[TopCustomerItem],
    status_code=status.HTTP_200_OK,
)
async def customer_insights(
    claims: CurrentClaims,
    session: DbSession,
    limit: int = Query(default=20, ge=1, le=50),
) -> list[TopCustomerItem]:
    """Top customers ranked by total spend, with visit counts."""
    async with session.begin():
        return await CustomerService(session).top_customers(claims.workshop_id, limit)


@router.get(
    "/outstanding",
    response_model=list[OutstandingCustomerItem],
    status_code=status.HTTP_200_OK,
)
async def outstanding_customers(
    claims: CurrentClaims,
    session: DbSession,
    limit: int = Query(default=20, ge=1, le=50),
) -> list[OutstandingCustomerItem]:
    """Customers with unpaid balance on completed jobs (udhaar-lite)."""
    async with session.begin():
        return await CustomerService(session).outstanding_customers(claims.workshop_id, limit)


@router.get("/history", response_model=CustomerHistoryResponse, status_code=status.HTTP_200_OK)
async def get_history(
    claims: CurrentClaims,
    session: DbSession,
    vehicle_number: str | None = Query(default=None, description="Vehicle registration number"),
    phone: str | None = Query(default=None, description="Customer phone number"),
) -> CustomerHistoryResponse:
    """Fetch all past jobs by vehicle number or customer phone."""
    async with session.begin():
        return await CustomerService(session).get_history(
            claims.workshop_id, vehicle_number=vehicle_number, phone=phone
        )
