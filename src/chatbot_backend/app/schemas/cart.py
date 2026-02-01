from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class AddToCartRequest(BaseModel):
    """Request schema for adding product to cart."""

    product_id: int = Field(..., description="Product ID to add to cart")

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 1
            }
        }


class RemoveFromCartRequest(BaseModel):
    """Request schema for removing product from cart."""

    order_item_id: str = Field(..., description="Order item ID to remove from cart")

    class Config:
        json_schema_extra = {
            "example": {
                "order_item_id": "orderitem_20240131_abc123"
            }
        }


class CartItemResponse(BaseModel):
    """Response schema for cart item."""

    order_item_id: str = Field(..., description="Order item unique identifier")
    product_id: int = Field(..., description="Product ID")
    product_name: Optional[str] = Field(None, description="Product name")
    product_brand: Optional[str] = Field(None, description="Product brand")
    retail_price: Optional[float] = Field(None, description="Product price")
    department: Optional[str] = Field(None, description="Product department")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_item_id": "orderitem_20240131_abc123",
                "product_id": 1,
                "product_name": "Classic T-Shirt",
                "product_brand": "BrandName",
                "retail_price": 29.99,
                "department": "Men"
            }
        }


class CartResponse(BaseModel):
    """Response schema for cart."""

    order_id: int = Field(..., description="Order/Cart ID")
    customer_id: int = Field(..., description="Customer ID")
    status: str = Field(..., description="Cart status")
    items: List[CartItemResponse] = Field(..., description="Cart items")
    num_of_item: int = Field(..., description="Number of items in cart")
    total_price: float = Field(..., description="Total price of all items")
    created_at: Optional[datetime] = Field(None, description="Cart creation timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "customer_id": 1,
                "status": "Cart",
                "items": [
                    {
                        "order_item_id": "orderitem_20240131_abc123",
                        "product_id": 1,
                        "product_name": "Classic T-Shirt",
                        "product_brand": "BrandName",
                        "retail_price": 29.99,
                        "department": "Men"
                    }
                ],
                "num_of_item": 1,
                "total_price": 29.99,
                "created_at": "2024-01-31T10:00:00Z"
            }
        }


class AddToCartResponse(BaseModel):
    """Response schema for add to cart action."""

    order_item_id: str = Field(..., description="Created order item ID")
    order_id: int = Field(..., description="Order/Cart ID")
    product_id: int = Field(..., description="Product ID added")
    message: str = Field(default="Product added to cart successfully")

    class Config:
        json_schema_extra = {
            "example": {
                "order_item_id": "orderitem_20240131_abc123",
                "order_id": 1,
                "product_id": 1,
                "message": "Product added to cart successfully"
            }
        }


class RemoveFromCartResponse(BaseModel):
    """Response schema for remove from cart action."""

    order_item_id: str = Field(..., description="Removed order item ID")
    message: str = Field(default="Product removed from cart successfully")

    class Config:
        json_schema_extra = {
            "example": {
                "order_item_id": "orderitem_20240131_abc123",
                "message": "Product removed from cart successfully"
            }
        }


class ClearCartResponse(BaseModel):
    """Response schema for clear cart action."""

    order_id: int = Field(..., description="Cleared order/cart ID")
    items_removed: int = Field(..., description="Number of items removed")
    message: str = Field(default="Cart cleared successfully")

    class Config:
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "items_removed": 5,
                "message": "Cart cleared successfully"
            }
        }
