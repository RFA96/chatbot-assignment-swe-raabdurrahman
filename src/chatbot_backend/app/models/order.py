from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.db.database import Base


class Order(Base):
    """Order model corresponding to tbl_order."""

    __tablename__ = "tbl_order"

    order_id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(
        Integer,
        ForeignKey("tbl_customers.customer_id"),
        nullable=True,
        index=True
    )
    status = Column(String(60), nullable=True, index=True)
    num_of_item = Column(Integer, nullable=True)
    voucher_id = Column(
        String(60),
        ForeignKey("tbl_voucher.voucher_id"),
        nullable=True,
        index=True
    )
    shipping_address_id = Column(
        String(60),
        ForeignKey("tbl_customer_address.customer_address_id"),
        nullable=True
    )
    subtotal = Column(Float, nullable=True)
    discount_amount = Column(Float, default=0)
    total_amount = Column(Float, nullable=True)
    created_by = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    returned_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    updated_by = Column(String(128), nullable=True)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Composite index for status and created_at
    __table_args__ = (
        Index("tbl_order_status_created_idx", "status", "created_at"),
    )

    # Relationships
    customer = relationship("Customer", backref="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    voucher = relationship("Voucher", backref="orders")
    shipping_address = relationship("CustomerAddress", backref="orders")


class OrderItem(Base):
    """Order item model corresponding to tbl_order_items."""

    __tablename__ = "tbl_order_items"

    order_item_id = Column(String(60), primary_key=True)
    order_id = Column(
        Integer,
        ForeignKey("tbl_order.order_id"),
        nullable=True,
        index=True
    )
    customer_id = Column(
        Integer,
        ForeignKey("tbl_customers.customer_id"),
        nullable=True,
        index=True
    )
    product_id = Column(
        Integer,
        ForeignKey("tbl_product.product_id"),
        nullable=True,
        index=True
    )

    # Relationships
    order = relationship("Order", back_populates="order_items")
    customer = relationship("Customer", backref="order_items")
    product = relationship("Product", back_populates="order_items")
