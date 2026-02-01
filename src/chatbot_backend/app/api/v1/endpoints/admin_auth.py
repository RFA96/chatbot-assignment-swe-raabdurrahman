from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.api.deps import (
    DbSession,
    CurrentAdmin,
    AdminCredentials,
    get_client_ip,
    get_user_agent
)
from app.schemas.auth import AdminLoginRequest
from app.services.admin_auth_service import AdminAuthService
from app.utils.response_utils import success_response

router = APIRouter()


@router.post(
    "/login",
    response_class=JSONResponse,
    summary="Admin Login",
    description="Authenticate an admin using username and password"
)
async def login(
    request: Request,
    login_data: AdminLoginRequest,
    db: DbSession
):
    """
    Admin login endpoint.

    - **username**: Admin's username
    - **password**: Admin's password

    Returns a JWT access token and session information.
    """
    service = AdminAuthService(db)
    result = await service.authenticate(
        username=login_data.username,
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
    summary="Get Current Admin Profile",
    description="Get the profile of the currently authenticated admin"
)
async def get_profile(
    current_admin: CurrentAdmin,
    db: DbSession
):
    """
    Get current admin's profile.

    Requires a valid JWT token in the Authorization header.
    """
    service = AdminAuthService(db)
    result = await service.get_profile(current_admin)
    return success_response(
        message="Profile retrieved successfully",
        data=result
    )


@router.post(
    "/logout",
    response_class=JSONResponse,
    summary="Admin Logout",
    description="Invalidate the current session"
)
async def logout(
    credentials: AdminCredentials,
    db: DbSession
):
    """
    Logout the current admin.

    This invalidates the session associated with the provided token.
    """
    service = AdminAuthService(db)
    session_id = await service.logout(credentials.credentials)
    return success_response(
        message="Successfully logged out",
        data={"session_id": session_id}
    )
