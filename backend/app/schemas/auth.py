from pydantic import BaseModel, ConfigDict, Field


class TokenClaims(BaseModel):
    user_id: str
    workshop_id: str
    role: str


class SignupRequest(BaseModel):
    mobile: str = Field(..., description="Mobile number (03xx or +923xx)")
    password: str = Field(..., min_length=8, description="Min 8 characters")
    full_name: str = Field(..., min_length=2, max_length=200)
    workshop_name: str = Field(..., min_length=2, max_length=200)
    workshop_address: str | None = Field(None, max_length=500)
    workshop_whatsapp: str | None = Field(None, description="Workshop WhatsApp number")


class LoginRequest(BaseModel):
    mobile: str = Field(..., description="Registered mobile number")
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workshop_id: str
    mobile: str
    role: str
    full_name: str
    is_active: bool


class MechanicCreate(BaseModel):
    mobile: str = Field(..., description="Mobile number (03xx or +923xx)")
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=200)


class MechanicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    mobile: str
    full_name: str
    is_active: bool
    is_available: bool = True


class MechanicUpdate(BaseModel):
    is_active: bool
