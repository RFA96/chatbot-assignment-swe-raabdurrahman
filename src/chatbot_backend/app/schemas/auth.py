from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class CustomerLoginRequest(BaseModel):
    """Request schema for customer login."""

    email: EmailStr = Field(..., description="Customer email address")
    password: str = Field(..., min_length=1, description="Customer password")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "customer@example.com",
                "password": "yourpassword"
            }
        }


class AdminLoginRequest(BaseModel):
    """Request schema for admin login."""

    username: str = Field(..., min_length=1, description="Admin username")
    password: str = Field(..., min_length=1, description="Admin password")

    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
                "password": "yourpassword"
            }
        }


class TokenResponse(BaseModel):
    """Response schema for successful authentication."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_at: datetime = Field(..., description="Token expiration timestamp")
    session_id: str = Field(..., description="Session identifier")

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_at": "2024-01-31T12:00:00Z",
                "session_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


class CustomerProfileResponse(BaseModel):
    """Response schema for customer profile."""

    customer_id: int
    full_name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminProfileResponse(BaseModel):
    """Response schema for admin profile."""

    user_admin_id: str
    full_name: Optional[str] = None
    username: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LogoutResponse(BaseModel):
    """Response schema for logout."""

    message: str = Field(default="Successfully logged out")
    session_id: str = Field(..., description="Terminated session ID")


class SessionInfo(BaseModel):
    """Schema for session information."""

    session_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    expires_at: datetime
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
