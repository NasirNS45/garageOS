from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import JWTError, decode_token
from app.schemas.auth import TokenClaims

_bearer = HTTPBearer(auto_error=False)


async def get_current_claims(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> TokenClaims:
    if credentials is None:
        raise UnauthorizedError()
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise UnauthorizedError("Invalid token type")
        return TokenClaims(
            user_id=payload["sub"],
            workshop_id=payload["workshop_id"],
            role=payload["role"],
        )
    except (JWTError, KeyError) as exc:
        raise UnauthorizedError("Invalid or expired token") from exc


def require_owner(
    claims: Annotated[TokenClaims, Depends(get_current_claims)],
) -> TokenClaims:
    if claims.role != "owner":
        raise ForbiddenError()
    return claims


# Convenience type aliases
CurrentClaims = Annotated[TokenClaims, Depends(get_current_claims)]
OwnerClaims = Annotated[TokenClaims, Depends(require_owner)]
DbSession = Annotated[AsyncSession, Depends(get_session)]
