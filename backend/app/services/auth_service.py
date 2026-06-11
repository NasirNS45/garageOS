import logging

from sqlalchemy.ext.asyncio import AsyncSession

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
from app.repositories.user_repository import UserRepository
from app.repositories.workshop_repository import WorkshopRepository
from app.schemas.auth import (
    LoginRequest,
    MechanicCreate,
    MechanicResponse,
    SignupRequest,
    TokenResponse,
)
from app.utils.mobile import normalize_mobile

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self._user_repo = UserRepository(session)
        self._workshop_repo = WorkshopRepository(session)
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
            password_hash=hash_password(payload.password),
            full_name=payload.full_name,
            role=UserRole.owner,
        )

        logger.info(
            "New workshop registered",
            extra={"workshop_id": workshop.id, "user_id": user.id},
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
        if user is None or not verify_password(payload.password, user.password_hash):
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
            password_hash=hash_password(payload.password),
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
