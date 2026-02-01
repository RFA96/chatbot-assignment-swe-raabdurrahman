from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class MovementTypeEnum(str, Enum):
    """Stock movement type enumeration."""
    IN = "IN"
    OUT = "OUT"
    RESERVED = "RESERVED"
    RELEASED = "RELEASED"
    ADJUSTMENT = "ADJUSTMENT"


class ReferenceTypeEnum(str, Enum):
    """Reference type enumeration for stock movements."""
    ORDER = "ORDER"
    MANUAL = "MANUAL"
    IMPORT = "IMPORT"
    RETURN = "RETURN"


class StockStatusEnum(str, Enum):
    """Stock status enumeration."""
    IN_STOCK = "IN_STOCK"
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class StockInfoResponse(BaseModel):
    """Response schema for product stock information."""

    product_id: int = Field(..., description="Product unique identifier")
    product_name: Optional[str] = Field(None, description="Product name")
    stock_quantity: int = Field(..., description="Current total stock quantity")
    reserved_quantity: int = Field(..., description="Quantity reserved by pending orders")
    available_quantity: int = Field(..., description="Quantity available for sale")
    low_stock_threshold: int = Field(..., description="Low stock alert threshold")
    is_track_stock: bool = Field(..., description="Whether stock is tracked")
    stock_status: str = Field(..., description="Stock status (IN_STOCK, LOW_STOCK, OUT_OF_STOCK)")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "product_id": 1,
                "product_name": "Classic T-Shirt",
                "stock_quantity": 100,
                "reserved_quantity": 5,
                "available_quantity": 95,
                "low_stock_threshold": 10,
                "is_track_stock": True,
                "stock_status": "IN_STOCK"
            }
        }


class StockMovementResponse(BaseModel):
    """Response schema for stock movement."""

    stock_movement_id: str = Field(..., description="Movement unique identifier")
    product_id: int = Field(..., description="Product ID")
    movement_type: str = Field(..., description="Type of movement (IN, OUT, RESERVED, RELEASED, ADJUSTMENT)")
    quantity: int = Field(..., description="Quantity moved")
    quantity_before: int = Field(..., description="Stock before movement")
    quantity_after: int = Field(..., description="Stock after movement")
    reference_type: Optional[str] = Field(None, description="Reference type (ORDER, MANUAL, IMPORT, RETURN)")
    reference_id: Optional[str] = Field(None, description="Reference identifier")
    notes: Optional[str] = Field(None, description="Additional notes")
    created_by: Optional[str] = Field(None, description="User who created the movement")
    created_at: Optional[datetime] = Field(None, description="Movement timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "stock_movement_id": "stockmov_20240131_abc123",
                "product_id": 1,
                "movement_type": "IN",
                "quantity": 50,
                "quantity_before": 50,
                "quantity_after": 100,
                "reference_type": "MANUAL",
                "reference_id": None,
                "notes": "Initial stock replenishment",
                "created_by": "admin",
                "created_at": "2024-01-31T10:00:00Z"
            }
        }


class StockMovementListResponse(BaseModel):
    """Response schema for paginated stock movement list."""

    items: List[StockMovementResponse] = Field(..., description="List of stock movements")
    total: int = Field(..., description="Total number of movements")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")


class LowStockProductResponse(BaseModel):
    """Response schema for low stock product."""

    product_id: int = Field(..., description="Product unique identifier")
    product_name: Optional[str] = Field(None, description="Product name")
    product_brand: Optional[str] = Field(None, description="Product brand")
    product_category_name: Optional[str] = Field(None, description="Category name")
    stock_quantity: int = Field(..., description="Current stock quantity")
    reserved_quantity: int = Field(..., description="Reserved quantity")
    available_quantity: int = Field(..., description="Available quantity")
    low_stock_threshold: int = Field(..., description="Low stock threshold")
    stock_status: str = Field(..., description="Stock status")

    class Config:
        from_attributes = True


class LowStockListResponse(BaseModel):
    """Response schema for low stock products list."""

    items: List[LowStockProductResponse] = Field(..., description="List of low stock products")
    total: int = Field(..., description="Total number of low stock products")


class AddStockRequest(BaseModel):
    """Request schema for adding stock."""

    quantity: int = Field(..., gt=0, description="Quantity to add (must be positive)")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes")

    class Config:
        json_schema_extra = {
            "example": {
                "quantity": 50,
                "notes": "Restocking from supplier"
            }
        }


class RemoveStockRequest(BaseModel):
    """Request schema for removing stock."""

    quantity: int = Field(..., gt=0, description="Quantity to remove (must be positive)")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes")

    class Config:
        json_schema_extra = {
            "example": {
                "quantity": 10,
                "notes": "Damaged goods removal"
            }
        }


class AdjustStockRequest(BaseModel):
    """Request schema for adjusting stock to a specific quantity."""

    new_quantity: int = Field(..., ge=0, description="New stock quantity (must be non-negative)")
    notes: Optional[str] = Field(None, max_length=500, description="Reason for adjustment")

    class Config:
        json_schema_extra = {
            "example": {
                "new_quantity": 75,
                "notes": "Inventory count adjustment"
            }
        }


class UpdateStockSettingsRequest(BaseModel):
    """Request schema for updating stock settings."""

    low_stock_threshold: Optional[int] = Field(None, ge=0, description="Low stock alert threshold")
    is_track_stock: Optional[bool] = Field(None, description="Enable/disable stock tracking")

    class Config:
        json_schema_extra = {
            "example": {
                "low_stock_threshold": 15,
                "is_track_stock": True
            }
        }


class StockOperationResponse(BaseModel):
    """Response schema for stock operations."""

    product_id: int = Field(..., description="Product ID")
    movement_id: str = Field(..., description="Stock movement ID created")
    movement_type: str = Field(..., description="Type of movement")
    quantity_changed: int = Field(..., description="Quantity changed")
    previous_stock: int = Field(..., description="Stock before operation")
    current_stock: int = Field(..., description="Stock after operation")
    message: str = Field(..., description="Operation result message")

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 1,
                "movement_id": "stockmov_20240131_abc123",
                "movement_type": "IN",
                "quantity_changed": 50,
                "previous_stock": 50,
                "current_stock": 100,
                "message": "Stock added successfully"
            }
        }
