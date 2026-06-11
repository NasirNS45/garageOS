from fastapi import APIRouter, Query, status

from app.core.dependencies import CurrentClaims, DbSession
from app.schemas.customer import CustomerHistoryResponse
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["customers"])


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
