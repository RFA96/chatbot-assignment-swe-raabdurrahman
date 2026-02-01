from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer, CustomerSession
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


class CustomerAuthService:
    """Service for handling customer authentication."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Authenticate a customer and create a session.

        Args:
            email: Customer email
            password: Plain text password
            ip_address: Client IP address
            user_agent: Client user agent string

        Returns:
            Dict with access token and session info

        Raises:
            InvalidCredentialsError: If credentials are invalid
        """
        # Find customer by email
        result = await self.db.execute(
            select(Customer).where(Customer.email == email)
        )
        customer = result.scalar_one_or_none()

        if not customer or not customer.password:
            raise InvalidCredentialsError()

        # Verify password
        if not verify_password(password, customer.password):
            raise InvalidCredentialsError()

        # Create JWT token
        token, expires_at = create_access_token(
            subject=customer.customer_id,
            user_type="customer"
        )

        # Create session
        session_id = generate_session_id()
        session = CustomerSession(
            session_id=session_id,
            customer_id=customer.customer_id,
            token=token,
            ip_address=ip_address,
            user_agent=user_agent[:512] if user_agent else None,
            expires_at=expires_at,
            created_at=datetime.utcnow()
        )

        self.db.add(session)
        await self.db.commit()

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_at": expires_at,
            "session_id": session_id
        }

    async def validate_session(self, token: str) -> Customer:
        """
        Validate a session token and return the customer.

        Args:
            token: JWT token

        Returns:
            Customer object

        Raises:
            SessionNotFoundError: If session doesn't exist
            SessionExpiredError: If session has expired
        """
        # Decode token
        payload = decode_token(token)
        if not payload:
            raise SessionNotFoundError()

        # Find session by token
        result = await self.db.execute(
            select(CustomerSession).where(CustomerSession.token == token)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise SessionNotFoundError()

        # Check expiration
        if session.expires_at < datetime.utcnow():
            raise SessionExpiredError()

        # Get customer
        result = await self.db.execute(
            select(Customer).where(Customer.customer_id == session.customer_id)
        )
        customer = result.scalar_one_or_none()

        if not customer:
            raise SessionNotFoundError()

        return customer

    async def get_profile(self, customer: Customer) -> Dict[str, Any]:
        """
        Get customer profile.

        Args:
            customer: Customer object

        Returns:
            Dict with customer profile data
        """
        return {
            "customer_id": customer.customer_id,
            "full_name": customer.full_name,
            "email": customer.email,
            "age": customer.age,
            "gender": customer.gender,
            "created_at": customer.created_at
        }

    async def logout(self, token: str) -> str:
        """
        Logout a customer by invalidating the session.

        Args:
            token: JWT token

        Returns:
            Session ID that was terminated

        Raises:
            SessionNotFoundError: If session doesn't exist
        """
        result = await self.db.execute(
            select(CustomerSession).where(CustomerSession.token == token)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise SessionNotFoundError()

        session_id = session.session_id

        await self.db.execute(
            delete(CustomerSession).where(CustomerSession.token == token)
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
            delete(CustomerSession).where(
                CustomerSession.expires_at < datetime.utcnow()
            )
        )
        await self.db.commit()
        return result.rowcount
