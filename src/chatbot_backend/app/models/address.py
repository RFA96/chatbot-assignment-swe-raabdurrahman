from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class CustomerAddress(Base):
    """Customer address model corresponding to tbl_customer_address."""

    __tablename__ = "tbl_customer_address"

    customer_address_id = Column(String(60), primary_key=True)
    customer_id = Column(
        Integer,
        ForeignKey("tbl_customers.customer_id"),
        nullable=True,
        index=True
    )
    customer_address_label = Column(String(128), nullable=True)
    state = Column(String(255), nullable=True)
    street_address = Column(String(255), nullable=True)
    postal_code = Column(String(255), nullable=True)
    city = Column(String(255), nullable=True)
    country = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_by = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(String(128), nullable=True)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", backref="addresses")
