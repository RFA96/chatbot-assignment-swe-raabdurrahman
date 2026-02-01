from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class AddressResponse(BaseModel):
    """Response schema for customer address."""

    customer_address_id: str = Field(..., description="Address unique identifier")
    customer_id: int = Field(..., description="Customer ID")
    customer_address_label: Optional[str] = Field(None, description="Address label (Home, Office, etc)")
    street_address: Optional[str] = Field(None, description="Street address")
    city: Optional[str] = Field(None, description="City")
    state: Optional[str] = Field(None, description="State/Province")
    postal_code: Optional[str] = Field(None, description="Postal/ZIP code")
    country: Optional[str] = Field(None, description="Country")
    latitude: Optional[float] = Field(None, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, description="Longitude coordinate")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "customer_address_id": "customeraddress_20240131_abc123",
                "customer_id": 1,
                "customer_address_label": "Home",
                "street_address": "123 Main St",
                "city": "Jakarta",
                "state": "DKI Jakarta",
                "postal_code": "12345",
                "country": "Indonesia",
                "latitude": -6.2088,
                "longitude": 106.8456,
                "created_at": "2024-01-31T10:00:00Z"
            }
        }


class AddressListResponse(BaseModel):
    """Response schema for address list."""

    items: List[AddressResponse] = Field(..., description="List of addresses")
    total: int = Field(..., description="Total number of addresses")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "customer_address_id": "customeraddress_20240131_abc123",
                        "customer_id": 1,
                        "customer_address_label": "Home",
                        "street_address": "123 Main St",
                        "city": "Jakarta",
                        "state": "DKI Jakarta",
                        "postal_code": "12345",
                        "country": "Indonesia"
                    }
                ],
                "total": 1
            }
        }
