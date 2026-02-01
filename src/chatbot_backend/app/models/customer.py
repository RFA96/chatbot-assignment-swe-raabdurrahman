from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Customer(Base):
    """Customer model corresponding to tbl_customers."""

    __tablename__ = "tbl_customers"

    customer_id = Column(Integer, primary_key=True)
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password = Column(String(255), nullable=True)  # Bcrypt encrypted
    age = Column(Integer, nullable=True)
    gender = Column(String(1), nullable=True)  # M for male, F for female
    created_by = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(String(128), nullable=True)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    sessions = relationship(
        "CustomerSession",
        back_populates="customer",
        cascade="all, delete-orphan"
    )


class CustomerSession(Base):
    """Customer session model corresponding to tbl_customer_session."""

    __tablename__ = "tbl_customer_session"

    session_id = Column(String(128), primary_key=True)
    customer_id = Column(
        Integer,
        ForeignKey("tbl_customers.customer_id", ondelete="CASCADE"),
        nullable=False
    )
    token = Column(String(512), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(512), nullable=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="sessions")
