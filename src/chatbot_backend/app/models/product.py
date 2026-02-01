from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Boolean, Text, CheckConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base


class ProductCategory(Base):
    """Product category model corresponding to tbl_product_category."""

    __tablename__ = "tbl_product_category"

    product_category_id = Column(String(60), primary_key=True)
    product_category_name = Column(String(255), nullable=True)
    created_by = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(String(128), nullable=True)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    products = relationship("Product", back_populates="category")


class Product(Base):
    """Product model corresponding to tbl_product."""

    __tablename__ = "tbl_product"

    product_id = Column(Integer, primary_key=True)
    product_category_id = Column(
        String(60),
        ForeignKey("tbl_product_category.product_category_id"),
        nullable=True,
        index=True
    )
    product_name = Column(String(255), nullable=True)
    product_brand = Column(String(255), nullable=True, index=True)
    retail_price = Column(Float, nullable=True)
    department = Column(String(128), nullable=True, index=True)

    # Stock management columns
    stock_quantity = Column(Integer, default=0, nullable=False)
    reserved_quantity = Column(Integer, default=0, nullable=False)
    low_stock_threshold = Column(Integer, default=10, nullable=False)
    is_track_stock = Column(Boolean, default=True, nullable=False)

    created_by = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(String(128), nullable=True)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("ProductCategory", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    stock_movements = relationship("StockMovement", back_populates="product")

    __table_args__ = (
        CheckConstraint('stock_quantity >= 0', name='chk_stock_quantity_non_negative'),
        CheckConstraint('reserved_quantity >= 0', name='chk_reserved_quantity_non_negative'),
        CheckConstraint('reserved_quantity <= stock_quantity', name='chk_reserved_not_exceed_stock'),
        CheckConstraint('low_stock_threshold >= 0', name='chk_low_stock_threshold_positive'),
        Index('tbl_product_stock_idx', 'stock_quantity'),
        Index('tbl_product_low_stock_idx', 'stock_quantity', 'low_stock_threshold', postgresql_where='is_track_stock = TRUE'),
    )

    @property
    def available_quantity(self) -> int:
        """Calculate available quantity (stock - reserved)."""
        return self.stock_quantity - self.reserved_quantity

    @property
    def stock_status(self) -> str:
        """Get current stock status."""
        if self.stock_quantity == 0:
            return "OUT_OF_STOCK"
        elif self.stock_quantity <= self.low_stock_threshold:
            return "LOW_STOCK"
        return "IN_STOCK"


class StockMovement(Base):
    """Stock movement model for tracking inventory changes."""

    __tablename__ = "tbl_stock_movement"

    stock_movement_id = Column(String(60), primary_key=True)
    product_id = Column(
        Integer,
        ForeignKey("tbl_product.product_id"),
        nullable=False,
        index=True
    )
    movement_type = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    reference_type = Column(String(50), nullable=True)
    reference_id = Column(String(60), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="stock_movements")

    __table_args__ = (
        CheckConstraint(
            "movement_type IN ('IN', 'OUT', 'RESERVED', 'RELEASED', 'ADJUSTMENT')",
            name='chk_movement_type'
        ),
        CheckConstraint('quantity > 0', name='chk_quantity_positive'),
        CheckConstraint('quantity_after >= 0', name='chk_quantity_after_non_negative'),
        Index('tbl_stock_movement_type_idx', 'movement_type'),
        Index('tbl_stock_movement_created_at_idx', 'created_at'),
        Index('tbl_stock_movement_reference_idx', 'reference_type', 'reference_id'),
    )
