from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.api.deps import (
    DbSession,
    CurrentCustomer,
    CustomerCredentials,
    get_client_ip,
    get_user_agent
)
from app.schemas.auth import CustomerLoginRequest
from app.services.customer_auth_service import CustomerAuthService
from app.utils.response_utils import success_response

router = APIRouter()


@router.post(
    "/login",
    response_class=JSONResponse,
    summary="Customer Login",
    description="Authenticate a customer using email and password"
)
async def login(
    request: Request,
    login_data: CustomerLoginRequest,
    db: DbSession
):
    """
    Customer login endpoint.

    - **email**: Customer's email address
    - **password**: Customer's password

    Returns a JWT access token and session information.
    """
    service = CustomerAuthService(db)
    result = await service.authenticate(
        email=login_data.email,
        password=login_data.password,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    return success_response(
        message="Login successful",
        data=result
    )


@router.get(
    "/me",
    response_class=JSONResponse,
    summary="Get Current Customer Profile",
    description="Get the profile of the currently authenticated customer"
)
async def get_profile(
    current_customer: CurrentCustomer,
    db: DbSession
):
    """
    Get current customer's profile.

    Requires a valid JWT token in the Authorization header.
    """
    service = CustomerAuthService(db)
    result = await service.get_profile(current_customer)
    return success_response(
        message="Profile retrieved successfully",
        data=result
    )


@router.post(
    "/logout",
    response_class=JSONResponse,
    summary="Customer Logout",
    description="Invalidate the current session"
)
async def logout(
    credentials: CustomerCredentials,
    db: DbSession
):
    """
    Logout the current customer.

    This invalidates the session associated with the provided token.
    """
    service = CustomerAuthService(db)
    session_id = await service.logout(credentials.credentials)
    return success_response(
        message="Successfully logged out",
        data={"session_id": session_id}
    )
