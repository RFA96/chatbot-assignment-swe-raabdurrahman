from datetime import datetime, timezone
from typing import Optional, Dict, Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin import UserAdmin, AdminSession
from app.core.security import (
    verify_password,
    create_access_token,
    generate_session_id,
    decode_token
)
from app.core.exceptions import (
    InvalidCredentialsError,
    SessionNotFoundError,
    SessionExpiredError
)


class AdminAuthService:
    """Service for handling admin authentication."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate(
        self,
        username: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Authenticate an admin user and create a session.

        Args:
            username: Admin username
            password: Plain text password
            ip_address: Client IP address
            user_agent: Client user agent string

        Returns:
            Dict with access token and session info

        Raises:
            InvalidCredentialsError: If credentials are invalid
        """
        # Find admin by username
        result = await self.db.execute(
            select(UserAdmin).where(UserAdmin.username == username)
        )
        admin = result.scalar_one_or_none()

        if not admin or not admin.password:
            raise InvalidCredentialsError(detail="Invalid username or password")

        # Verify password
        if not verify_password(password, admin.password):
            raise InvalidCredentialsError(detail="Invalid username or password")

        # Create JWT token
        token, expires_at = create_access_token(
            subject=admin.user_admin_id,
            user_type="admin"
        )

        # Create session
        session_id = generate_session_id()
        session = AdminSession(
            session_id=session_id,
            user_admin_id=admin.user_admin_id,
            token=token,
            ip_address=ip_address,
            user_agent=user_agent[:512] if user_agent else None,
            expires_at=expires_at,
            created_at=datetime.now(timezone.utc)
        )

        self.db.add(session)
        await self.db.commit()

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_at": expires_at,
            "session_id": session_id
        }

    async def validate_session(self, token: str) -> UserAdmin:
        """
        Validate a session token and return the admin.

        Args:
            token: JWT token

        Returns:
            UserAdmin object

        Raises:
            SessionNotFoundError: If session doesn't exist
            SessionExpiredError: If session has expired
        """
        # Decode token
        payload = decode_token(token)
        if not payload:
            raise SessionNotFoundError()

        # Verify token type
        if payload.get("type") != "admin":
            raise SessionNotFoundError()

        # Find session by token
        result = await self.db.execute(
            select(AdminSession).where(AdminSession.token == token)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise SessionNotFoundError()

        # Check expiration
        if session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise SessionExpiredError()

        # Get admin
        result = await self.db.execute(
            select(UserAdmin).where(UserAdmin.user_admin_id == session.user_admin_id)
        )
        admin = result.scalar_one_or_none()

        if not admin:
            raise SessionNotFoundError()

        return admin

    async def get_profile(self, admin: UserAdmin) -> Dict[str, Any]:
        """
        Get admin profile.

        Args:
            admin: UserAdmin object

        Returns:
            Dict with admin profile data
        """
        return {
            "user_admin_id": admin.user_admin_id,
            "full_name": admin.full_name,
            "username": admin.username,
            "created_at": admin.created_at
        }

    async def logout(self, token: str) -> str:
        """
        Logout an admin by invalidating the session.

        Args:
            token: JWT token

        Returns:
            Session ID that was terminated

        Raises:
            SessionNotFoundError: If session doesn't exist
        """
        result = await self.db.execute(
            select(AdminSession).where(AdminSession.token == token)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise SessionNotFoundError()

        session_id = session.session_id

        await self.db.execute(
            delete(AdminSession).where(AdminSession.token == token)
        )
        await self.db.commit()

        return session_id

    async def cleanup_expired_sessions(self) -> int:
        """
        Remove all expired sessions.

        Returns:
            Number of sessions removed
        """
        result = await self.db.execute(
            delete(AdminSession).where(
                AdminSession.expires_at < datetime.now(timezone.utc)
            )
        )
        await self.db.commit()
        return result.rowcount
