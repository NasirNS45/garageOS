from fastapi import APIRouter, Request, status

from app.core.dependencies import DbSession, OwnerClaims
from app.core.ratelimit import limiter
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    MechanicCreate,
    MechanicResponse,
    MechanicUpdate,
    RefreshRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def signup(request: Request, payload: SignupRequest, session: DbSession) -> TokenResponse:
    """Register a new workshop and owner account."""
    async with session.begin():
        return await AuthService(session).signup(payload)


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginRequest, session: DbSession) -> TokenResponse:
    """Login with mobile number and password."""
    async with session.begin():
        return await AuthService(session).login(payload)


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def refresh(payload: RefreshRequest, session: DbSession) -> TokenResponse:
    """Exchange a refresh token for a new access token."""
    async with session.begin():
        return await AuthService(session).refresh(payload.refresh_token)


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request, payload: ForgotPasswordRequest, session: DbSession
) -> ForgotPasswordResponse:
    """Request a password reset link for the registered mobile number."""
    async with session.begin():
        return await AuthService(session).forgot_password(payload)


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
async def reset_password(
    request: Request, payload: ResetPasswordRequest, session: DbSession
) -> None:
    """Reset password using a valid reset token."""
    async with session.begin():
        await AuthService(session).reset_password(payload)


@router.post("/mechanics", response_model=MechanicResponse, status_code=status.HTTP_201_CREATED)
async def add_mechanic(
    payload: MechanicCreate, claims: OwnerClaims, session: DbSession
) -> MechanicResponse:
    """Add a mechanic account to the workshop (owner only)."""
    async with session.begin():
        return await AuthService(session).add_mechanic(claims.workshop_id, payload)


@router.get("/mechanics", response_model=list[MechanicResponse], status_code=status.HTTP_200_OK)
async def list_mechanics(claims: OwnerClaims, session: DbSession) -> list[MechanicResponse]:
    """List all mechanics in the workshop, including inactive (owner only)."""
    async with session.begin():
        return await AuthService(session).list_mechanics(claims.workshop_id)


@router.patch(
    "/mechanics/{mechanic_id}",
    response_model=MechanicResponse,
    status_code=status.HTTP_200_OK,
)
async def update_mechanic(
    mechanic_id: str,
    payload: MechanicUpdate,
    claims: OwnerClaims,
    session: DbSession,
) -> MechanicResponse:
    """Activate or deactivate a mechanic (owner only)."""
    async with session.begin():
        return await AuthService(session).set_mechanic_active(
            claims.workshop_id, mechanic_id, payload.is_active
        )
