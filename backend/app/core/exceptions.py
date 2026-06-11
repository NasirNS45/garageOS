from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base for all domain exceptions. Register a single handler in main.py."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail: str = "An unexpected error occurred"
    code: str = "internal_error"

    def __init__(self, detail: str | None = None) -> None:
        super().__init__(
            status_code=self.status_code,
            detail={"detail": detail or self.detail, "code": self.code},
        )


class UnauthorizedError(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Authentication required"
    code = "unauthorized"


class ForbiddenError(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "You do not have permission to perform this action"
    code = "forbidden"


class NotFoundError(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Resource not found"
    code = "not_found"


class ConflictError(AppException):
    status_code = status.HTTP_409_CONFLICT
    detail = "Resource already exists"
    code = "conflict"


class ValidationError(AppException):
    status_code = 422
    detail = "Validation error"
    code = "validation_error"
