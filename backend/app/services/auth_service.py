import logging

from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import ConflictError, NotFoundError, UnauthorizedError
from app.core.security import (
    JWTError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import UserRole
from app.repositories.password_reset_repository import PasswordResetRepository
from app.repositories.user_repository import UserRepository
from app.repositories.workshop_repository import WorkshopRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    MechanicCreate,
    MechanicResponse,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
)
from app.services.pilot_analytics_service import PilotAnalyticsService
from app.services.whatsapp_service import WhatsAppService
from app.utils.mobile import normalize_mobile
from app.utils.reset_token import generate_reset_token, hash_reset_token

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self._user_repo = UserRepository(session)
        self._workshop_repo = WorkshopRepository(session)
        self._reset_repo = PasswordResetRepository(session)
        self._session = session

    async def signup(self, payload: SignupRequest) -> TokenResponse:
        try:
            mobile = normalize_mobile(payload.mobile)
        except ValueError as exc:
            from app.core.exceptions import ValidationError

            raise ValidationError(str(exc)) from exc

        if await self._user_repo.mobile_exists(mobile):
            raise ConflictError("This mobile number is already registered")

        ws_whatsapp = (
            normalize_mobile(payload.workshop_whatsapp) if payload.workshop_whatsapp else None
        )
        workshop = await self._workshop_repo.create(
            name=payload.workshop_name,
            address=payload.workshop_address,
            owner_contact=mobile,
            whatsapp_number=ws_whatsapp,
        )
        user = await self._user_repo.create(
            workshop_id=workshop.id,
            mobile=mobile,
            password_hash=await hash_password(payload.password),
            full_name=payload.full_name,
            role=UserRole.owner,
        )

        logger.info(
            "New workshop registered",
            extra={"workshop_id": workshop.id, "user_id": user.id},
        )
        await PilotAnalyticsService(self._session).track(
            "signup_completed",
            workshop_id=workshop.id,
            user_id=user.id,
        )
        return TokenResponse(
            access_token=create_access_token(user.id, workshop.id, user.role),
            refresh_token=create_refresh_token(user.id),
        )

    async def login(self, payload: LoginRequest) -> TokenResponse:
        try:
            mobile = normalize_mobile(payload.mobile)
        except ValueError as exc:
            raise UnauthorizedError("Invalid mobile number or password") from exc

        user = await self._user_repo.get_by_mobile(mobile)
        if user is None or not await verify_password(payload.password, user.password_hash):
            raise UnauthorizedError("Invalid mobile number or password")

        logger.info("User logged in", extra={"user_id": user.id})
        return TokenResponse(
            access_token=create_access_token(user.id, user.workshop_id, user.role),
            refresh_token=create_refresh_token(user.id),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise UnauthorizedError("Invalid token type")
            user_id: str = payload["sub"]
        except (JWTError, KeyError) as exc:
            raise UnauthorizedError("Invalid or expired refresh token") from exc

        # Look up user without workshop_id filter since we only have user_id here
        from sqlalchemy import select

        from app.models.user import User

        result = await self._session.execute(
            select(User).where(User.id == user_id, User.is_active.is_(True))
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise UnauthorizedError("User not found or inactive")

        return TokenResponse(
            access_token=create_access_token(user.id, user.workshop_id, user.role),
            refresh_token=create_refresh_token(user.id),
        )

    async def add_mechanic(self, workshop_id: str, payload: MechanicCreate) -> MechanicResponse:
        try:
            mobile = normalize_mobile(payload.mobile)
        except ValueError as exc:
            from app.core.exceptions import ValidationError

            raise ValidationError(str(exc)) from exc

        if await self._user_repo.mobile_exists(mobile):
            raise ConflictError("This mobile number is already registered")

        user = await self._user_repo.create(
            workshop_id=workshop_id,
            mobile=mobile,
            password_hash=await hash_password(payload.password),
            full_name=payload.full_name,
            role=UserRole.mechanic,
        )
        return MechanicResponse.model_validate(user)

    async def list_mechanics(self, workshop_id: str) -> list[MechanicResponse]:
        pairs = await self._user_repo.list_mechanics_with_availability(workshop_id)
        return [
            MechanicResponse.model_validate(
                {
                    "id": m.id,
                    "mobile": m.mobile,
                    "full_name": m.full_name,
                    "is_active": m.is_active,
                    "is_available": available,
                }
            )
            for m, available in pairs
        ]

    async def set_mechanic_active(
        self, workshop_id: str, mechanic_id: str, is_active: bool
    ) -> MechanicResponse:
        user = await self._user_repo.get_by_id(mechanic_id, workshop_id)
        if user is None or user.role != UserRole.mechanic.value:
            raise NotFoundError("Mechanic not found")
        updated = await self._user_repo.set_active(mechanic_id, workshop_id, is_active)
        if updated is None:
            raise NotFoundError("Mechanic not found after update")
        logger.info(
            "Mechanic active status updated",
            extra={"mechanic_id": mechanic_id, "is_active": is_active},
        )
        return MechanicResponse.model_validate(
            {
                "id": updated.id,
                "mobile": updated.mobile,
                "full_name": updated.full_name,
                "is_active": updated.is_active,
                "is_available": True,
            }
        )

    async def forgot_password(self, payload: ForgotPasswordRequest) -> ForgotPasswordResponse:
        message = "If that mobile is registered, a reset link has been sent."
        try:
            mobile = normalize_mobile(payload.mobile)
        except ValueError:
            return ForgotPasswordResponse(message=message)

        user = await self._user_repo.get_by_mobile(mobile)
        if user is None:
            return ForgotPasswordResponse(message=message)

        raw_token = generate_reset_token()
        token_hash = hash_reset_token(raw_token)
        expires_at = datetime.now(UTC) + timedelta(hours=1)
        await self._reset_repo.create(user.id, token_hash, expires_at)

        reset_url = f"{get_settings().web_base_url.rstrip('/')}/reset-password?token={raw_token}"
        wa = WhatsAppService()
        sent = await wa.send_password_reset(mobile, user.full_name, reset_url)
        analytics = PilotAnalyticsService(self._session)
        if get_settings().whatsapp_enabled:
            await analytics.track_whatsapp_result(user.workshop_id, sent, "password_reset")
        else:
            await analytics.track(
                "password_reset_token_created",
                workshop_id=user.workshop_id,
                user_id=user.id,
            )

        logger.info("Password reset token created", extra={"user_id": user.id})
        response = ForgotPasswordResponse(message=message)
        if get_settings().debug:
            response.reset_token = raw_token
        return response

    async def reset_password(self, payload: ResetPasswordRequest) -> None:
        token_hash = hash_reset_token(payload.token)
        reset_token = await self._reset_repo.get_valid_by_hash(token_hash)
        if reset_token is None:
            raise UnauthorizedError("Invalid or expired reset token")

        password_hash = await hash_password(payload.password)
        await self._user_repo.update_password(reset_token.user_id, password_hash)
        await self._reset_repo.delete_by_user(reset_token.user_id)
        logger.info("Password reset completed", extra={"user_id": reset_token.user_id})
