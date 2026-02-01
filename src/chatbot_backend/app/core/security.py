from datetime import datetime, timedelta
from typing import Optional
import uuid
import warnings

from jose import jwt, JWTError

# Suppress passlib bcrypt version warning (compatibility issue with bcrypt 4.1+)
with warnings.catch_warnings():
    warnings.filterwarnings("ignore", message=".*trapped.*error reading bcrypt version.*")
    from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password, rounds=settings.BCRYPT_ROUNDS)


def create_access_token(
    subject: str,
    user_type: str,
    expires_delta: Optional[timedelta] = None
) -> tuple[str, datetime]:
    """
    Create a JWT access token.

    Args:
        subject: The subject of the token (user_id or customer_id)
        user_type: Either 'customer' or 'admin'
        expires_delta: Optional custom expiration time

    Returns:
        Tuple of (token, expires_at)
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "sub": str(subject),
        "type": user_type,
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4())
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt, expire


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.

    Args:
        token: The JWT token to decode

    Returns:
        The decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def generate_session_id() -> str:
    """Generate a unique session ID."""
    return str(uuid.uuid4())
