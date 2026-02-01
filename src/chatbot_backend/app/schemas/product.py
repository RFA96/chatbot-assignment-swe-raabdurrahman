from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, computed_field
from enum import Enum


# Base URL for product images (using Picsum placeholder)
PRODUCT_IMAGE_BASE_URL = "https://picsum.photos/seed"
PRODUCT_IMAGE_SIZE = 200


class DepartmentEnum(str, Enum):
    """Department enumeration."""
    MEN = "Men"
    WOMEN = "Women"


class ProductCategoryResponse(BaseModel):
    """Response schema for product category."""

    product_category_id: str = Field(..., description="Category unique identifier")
    product_category_name: Optional[str] = Field(None, description="Category name")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "product_category_id": "productcategory_20240131_abc123",
                "product_category_name": "Electronics",
                "created_at": "2024-01-31T10:00:00Z"
            }
        }


class ProductResponse(BaseModel):
    """Response schema for product."""

    product_id: int = Field(..., description="Product unique identifier")
    product_category_id: Optional[str] = Field(None, description="Category ID")
    product_name: Optional[str] = Field(None, description="Product name")
    product_brand: Optional[str] = Field(None, description="Product brand")
    retail_price: Optional[float] = Field(None, description="Retail price")
    department: Optional[str] = Field(None, description="Department (Men/Women)")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")

    @computed_field
    @property
    def image_url(self) -> str:
        """Generate image URL using Picsum with product_id as seed."""
        return f"{PRODUCT_IMAGE_BASE_URL}/{self.product_id}/{PRODUCT_IMAGE_SIZE}/{PRODUCT_IMAGE_SIZE}"

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "product_id": 1,
                "product_category_id": "productcategory_20240131_abc123",
                "product_name": "Classic T-Shirt",
                "product_brand": "BrandName",
                "retail_price": 29.99,
                "department": "Men",
                "image_url": "https://picsum.photos/seed/1/200/200",
                "created_at": "2024-01-31T10:00:00Z"
            }
        }


class ProductDetailResponse(BaseModel):
    """Response schema for product with category details."""

    product_id: int = Field(..., description="Product unique identifier")
    product_name: Optional[str] = Field(None, description="Product name")
    product_brand: Optional[str] = Field(None, description="Product brand")
    retail_price: Optional[float] = Field(None, description="Retail price")
    department: Optional[str] = Field(None, description="Department (Men/Women)")
    category: Optional[ProductCategoryResponse] = Field(None, description="Category details")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")

    @computed_field
    @property
    def image_url(self) -> str:
        """Generate image URL using Picsum with product_id as seed."""
        return f"{PRODUCT_IMAGE_BASE_URL}/{self.product_id}/{PRODUCT_IMAGE_SIZE}/{PRODUCT_IMAGE_SIZE}"

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Response schema for paginated product list."""

    items: List[ProductResponse] = Field(..., description="List of products")
    total: int = Field(..., description="Total number of products")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "product_id": 1,
                        "product_category_id": "productcategory_20240131_abc123",
                        "product_name": "Classic T-Shirt",
                        "product_brand": "BrandName",
                        "retail_price": 29.99,
                        "department": "Men",
                        "image_url": "https://picsum.photos/seed/1/200/200",
                        "created_at": "2024-01-31T10:00:00Z"
                    }
                ],
                "total": 100,
                "page": 1,
                "page_size": 10,
                "total_pages": 10
            }
        }


class CategoryListResponse(BaseModel):
    """Response schema for category list."""

    items: List[ProductCategoryResponse] = Field(..., description="List of categories")
    total: int = Field(..., description="Total number of categories")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "product_category_id": "productcategory_20240131_abc123",
                        "product_category_name": "Electronics",
                        "created_at": "2024-01-31T10:00:00Z"
                    }
                ],
                "total": 10
            }
        }


class ProductFilterParams(BaseModel):
    """Query parameters for filtering products."""

    category_id: Optional[str] = Field(None, description="Filter by category ID")
    brand: Optional[str] = Field(None, description="Filter by brand name")
    department: Optional[str] = Field(None, description="Filter by department (Men/Women)")
    min_price: Optional[float] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum price filter")
    search: Optional[str] = Field(None, description="Search by product name")
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(10, ge=1, le=100, description="Items per page")

    class Config:
        json_schema_extra = {
            "example": {
                "category_id": "productcategory_20240131_abc123",
                "brand": "BrandName",
                "department": "Men",
                "min_price": 10.0,
                "max_price": 100.0,
                "search": "shirt",
                "page": 1,
                "page_size": 10
            }
        }
