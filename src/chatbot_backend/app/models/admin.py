from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserAdmin(Base):
    """Admin user model corresponding to tbl_user_admin."""

    __tablename__ = "tbl_user_admin"

    user_admin_id = Column(String(60), primary_key=True)
    full_name = Column(String(255), nullable=True)
    username = Column(String(128), unique=True, index=True, nullable=True)
    password = Column(String(128), nullable=True)
    created_by = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(String(128), nullable=True)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    sessions = relationship(
        "AdminSession",
        back_populates="admin",
        cascade="all, delete-orphan"
    )


class AdminSession(Base):
    """Admin session model corresponding to tbl_admin_session."""

    __tablename__ = "tbl_admin_session"

    session_id = Column(String(128), primary_key=True)
    user_admin_id = Column(
        String(60),
        ForeignKey("tbl_user_admin.user_admin_id", ondelete="CASCADE"),
        nullable=False
    )
    token = Column(String(512), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(512), nullable=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    admin = relationship("UserAdmin", back_populates="sessions")
