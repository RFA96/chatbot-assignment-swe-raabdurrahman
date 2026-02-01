from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Index

from app.db.database import Base


class Voucher(Base):
    """Voucher model corresponding to tbl_voucher."""

    __tablename__ = "tbl_voucher"

    voucher_id = Column(String(60), primary_key=True)
    voucher_code = Column(String(50), unique=True, nullable=False, index=True)
    voucher_name = Column(String(255), nullable=True)
    discount_type = Column(String(20), nullable=False)  # 'percentage' or 'fixed'
    discount_value = Column(Float, nullable=False)
    min_purchase_amount = Column(Float, default=0)
    max_discount_amount = Column(Float, nullable=True)  # For percentage type
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)
    valid_from = Column(DateTime, nullable=True)
    valid_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(String(128), nullable=True)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("tbl_voucher_valid_idx", "valid_from", "valid_until"),
        Index("tbl_voucher_active_idx", "is_active"),
    )
