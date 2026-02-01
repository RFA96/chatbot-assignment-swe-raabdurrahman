from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum


class DiscountTypeEnum(str, Enum):
    """Discount type enumeration."""
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class ApplyVoucherRequest(BaseModel):
    """Request schema for applying voucher to cart."""

    voucher_code: str = Field(..., min_length=1, description="Voucher code to apply")

    class Config:
        json_schema_extra = {
            "example": {
                "voucher_code": "DISCOUNT20"
            }
        }


class VoucherResponse(BaseModel):
    """Response schema for voucher details."""

    voucher_id: str = Field(..., description="Voucher unique identifier")
    voucher_code: str = Field(..., description="Voucher code")
    voucher_name: Optional[str] = Field(None, description="Voucher name/description")
    discount_type: str = Field(..., description="Discount type (percentage/fixed)")
    discount_value: float = Field(..., description="Discount value")
    min_purchase_amount: Optional[float] = Field(None, description="Minimum purchase amount")
    max_discount_amount: Optional[float] = Field(None, description="Maximum discount for percentage type")
    valid_from: Optional[datetime] = Field(None, description="Valid from date")
    valid_until: Optional[datetime] = Field(None, description="Valid until date")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "voucher_id": "voucher_20240131_abc123",
                "voucher_code": "DISCOUNT20",
                "voucher_name": "20% Off All Items",
                "discount_type": "percentage",
                "discount_value": 20.0,
                "min_purchase_amount": 50.0,
                "max_discount_amount": 100.0,
                "valid_from": "2024-01-01T00:00:00Z",
                "valid_until": "2024-12-31T23:59:59Z"
            }
        }


class ApplyVoucherResponse(BaseModel):
    """Response schema for applying voucher."""

    voucher: VoucherResponse = Field(..., description="Applied voucher details")
    subtotal: float = Field(..., description="Cart subtotal before discount")
    discount_amount: float = Field(..., description="Discount amount applied")
    total_amount: float = Field(..., description="Total after discount")
    message: str = Field(default="Voucher applied successfully")

    class Config:
        json_schema_extra = {
            "example": {
                "voucher": {
                    "voucher_id": "voucher_20240131_abc123",
                    "voucher_code": "DISCOUNT20",
                    "voucher_name": "20% Off All Items",
                    "discount_type": "percentage",
                    "discount_value": 20.0,
                    "min_purchase_amount": 50.0,
                    "max_discount_amount": 100.0,
                    "valid_from": "2024-01-01T00:00:00Z",
                    "valid_until": "2024-12-31T23:59:59Z"
                },
                "subtotal": 100.0,
                "discount_amount": 20.0,
                "total_amount": 80.0,
                "message": "Voucher applied successfully"
            }
        }


class RemoveVoucherResponse(BaseModel):
    """Response schema for removing voucher."""

    subtotal: float = Field(..., description="Cart subtotal")
    total_amount: float = Field(..., description="Total amount (same as subtotal)")
    message: str = Field(default="Voucher removed successfully")

    class Config:
        json_schema_extra = {
            "example": {
                "subtotal": 100.0,
                "total_amount": 100.0,
                "message": "Voucher removed successfully"
            }
        }
