from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.schemas.cart import CartItemResponse
from app.schemas.voucher import VoucherResponse


class ShippingAddressResponse(BaseModel):
    """Response schema for shipping address."""

    customer_address_id: str = Field(..., description="Address unique identifier")
    customer_address_label: Optional[str] = Field(None, description="Address label (Home, Office, etc)")
    street_address: Optional[str] = Field(None, description="Street address")
    city: Optional[str] = Field(None, description="City")
    state: Optional[str] = Field(None, description="State/Province")
    postal_code: Optional[str] = Field(None, description="Postal/ZIP code")
    country: Optional[str] = Field(None, description="Country")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "customer_address_id": "customeraddress_20240131_abc123",
                "customer_address_label": "Home",
                "street_address": "123 Main St",
                "city": "Jakarta",
                "state": "DKI Jakarta",
                "postal_code": "12345",
                "country": "Indonesia"
            }
        }


class CheckoutRequest(BaseModel):
    """Request schema for checkout."""

    shipping_address_id: str = Field(..., description="Shipping address ID")
    voucher_code: Optional[str] = Field(None, description="Optional voucher code to apply")

    class Config:
        json_schema_extra = {
            "example": {
                "shipping_address_id": "customeraddress_20240131_abc123",
                "voucher_code": "DISCOUNT20"
            }
        }


class OrderResponse(BaseModel):
    """Response schema for order details."""

    order_id: int = Field(..., description="Order unique identifier")
    customer_id: int = Field(..., description="Customer ID")
    status: str = Field(..., description="Order status")
    num_of_item: int = Field(..., description="Number of items")
    subtotal: Optional[float] = Field(None, description="Subtotal before discount")
    discount_amount: Optional[float] = Field(None, description="Discount amount")
    total_amount: Optional[float] = Field(None, description="Total amount after discount")
    voucher: Optional[VoucherResponse] = Field(None, description="Applied voucher")
    shipping_address: Optional[ShippingAddressResponse] = Field(None, description="Shipping address")
    items: List[CartItemResponse] = Field(default_factory=list, description="Order items")
    created_at: Optional[datetime] = Field(None, description="Order creation timestamp")
    shipped_at: Optional[datetime] = Field(None, description="Shipped timestamp")
    delivered_at: Optional[datetime] = Field(None, description="Delivered timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "customer_id": 1,
                "status": "Processing",
                "num_of_item": 2,
                "subtotal": 100.0,
                "discount_amount": 20.0,
                "total_amount": 80.0,
                "voucher": {
                    "voucher_id": "voucher_20240131_abc123",
                    "voucher_code": "DISCOUNT20",
                    "voucher_name": "20% Off",
                    "discount_type": "percentage",
                    "discount_value": 20.0
                },
                "shipping_address": {
                    "customer_address_id": "customeraddress_20240131_abc123",
                    "customer_address_label": "Home",
                    "street_address": "123 Main St",
                    "city": "Jakarta"
                },
                "items": [
                    {
                        "order_item_id": "orderitem_20240131_abc123",
                        "product_id": 1,
                        "product_name": "Classic T-Shirt",
                        "retail_price": 50.0
                    }
                ],
                "created_at": "2024-01-31T10:00:00Z"
            }
        }


class CheckoutResponse(BaseModel):
    """Response schema for checkout action."""

    order: OrderResponse = Field(..., description="Created order details")
    message: str = Field(default="Order placed successfully")

    class Config:
        json_schema_extra = {
            "example": {
                "order": {
                    "order_id": 1,
                    "status": "Processing",
                    "total_amount": 80.0
                },
                "message": "Order placed successfully"
            }
        }


class OrderListResponse(BaseModel):
    """Response schema for order list."""

    items: List[OrderResponse] = Field(..., description="List of orders")
    total: int = Field(..., description="Total number of orders")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 0,
                "page": 1,
                "page_size": 10,
                "total_pages": 0
            }
        }
