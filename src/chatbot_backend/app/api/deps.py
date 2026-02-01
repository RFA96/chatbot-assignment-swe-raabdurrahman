from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.customer import Customer
from app.models.admin import UserAdmin
from app.services.customer_auth_service import CustomerAuthService
from app.services.admin_auth_service import AdminAuthService
from app.core.exceptions import AuthenticationError

# Security schemes
customer_security = HTTPBearer(
    scheme_name="CustomerAuth",
    description="JWT token for customer authentication"
)

admin_security = HTTPBearer(
    scheme_name="AdminAuth",
    description="JWT token for admin authentication"
)


def get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_user_agent(request: Request) -> str:
    """Extract user agent from request."""
    return request.headers.get("User-Agent", "unknown")


async def get_current_customer(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(customer_security)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Customer:
    """
    Dependency to get the current authenticated customer.

    Args:
        credentials: Bearer token credentials
        db: Database session

    Returns:
        Customer object

    Raises:
        AuthenticationError: If authentication fails
    """
    if not credentials:
        raise AuthenticationError()

    service = CustomerAuthService(db)
    return await service.validate_session(credentials.credentials)


async def get_current_admin(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(admin_security)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> UserAdmin:
    """
    Dependency to get the current authenticated admin.

    Args:
        credentials: Bearer token credentials
        db: Database session

    Returns:
        UserAdmin object

    Raises:
        AuthenticationError: If authentication fails
    """
    if not credentials:
        raise AuthenticationError()

    service = AdminAuthService(db)
    return await service.validate_session(credentials.credentials)


# Type aliases for cleaner endpoint signatures
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentCustomer = Annotated[Customer, Depends(get_current_customer)]
CurrentAdmin = Annotated[UserAdmin, Depends(get_current_admin)]
CustomerCredentials = Annotated[HTTPAuthorizationCredentials, Depends(customer_security)]
AdminCredentials = Annotated[HTTPAuthorizationCredentials, Depends(admin_security)]
