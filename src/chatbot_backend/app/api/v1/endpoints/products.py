from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.api.deps import DbSession
from app.services.product_service import ProductService
from app.utils.response_utils import success_response

router = APIRouter()


@router.get(
    "",
    response_class=JSONResponse,
    summary="Get Products",
    description="Retrieve products with optional filtering and pagination"
)
async def get_products(
    db: DbSession,
    category_id: Optional[str] = Query(
        None,
        description="Filter by category ID"
    ),
    brand: Optional[str] = Query(
        None,
        description="Filter by brand name (partial match)"
    ),
    department: Optional[str] = Query(
        None,
        description="Filter by department (Men/Women)"
    ),
    min_price: Optional[float] = Query(
        None,
        ge=0,
        description="Minimum price filter"
    ),
    max_price: Optional[float] = Query(
        None,
        ge=0,
        description="Maximum price filter"
    ),
    search: Optional[str] = Query(
        None,
        description="Search by product name (partial match)"
    ),
    page: int = Query(
        1,
        ge=1,
        description="Page number"
    ),
    page_size: int = Query(
        10,
        ge=1,
        le=100,
        description="Items per page (max: 100)"
    )
):
    """
    Get products with filtering and pagination.

    Supports filtering by:
    - **category_id**: Product category
    - **brand**: Brand name (partial match)
    - **department**: Men or Women
    - **min_price**: Minimum retail price
    - **max_price**: Maximum retail price
    - **search**: Product name (partial match)

    Pagination:
    - **page**: Page number (starts from 1)
    - **page_size**: Items per page (1-100)
    """
    service = ProductService(db)
    result = await service.get_products(
        category_id=category_id,
        brand=brand,
        department=department,
        min_price=min_price,
        max_price=max_price,
        search=search,
        page=page,
        page_size=page_size
    )
    return success_response(
        message="Products retrieved successfully",
        data=result
    )


@router.get(
    "/brands",
    response_class=JSONResponse,
    summary="Get All Brands",
    description="Retrieve all unique product brands"
)
async def get_brands(db: DbSession):
    """
    Get all unique product brands.

    Returns a list of all brand names available in the product catalog.
    """
    service = ProductService(db)
    brands = await service.get_brands()
    return success_response(
        message="Brands retrieved successfully",
        data={"brands": brands, "total": len(brands)}
    )


@router.get(
    "/departments",
    response_class=JSONResponse,
    summary="Get All Departments",
    description="Retrieve all unique product departments"
)
async def get_departments(db: DbSession):
    """
    Get all unique product departments.

    Returns a list of all departments (e.g., Men, Women).
    """
    service = ProductService(db)
    departments = await service.get_departments()
    return success_response(
        message="Departments retrieved successfully",
        data={"departments": departments, "total": len(departments)}
    )


@router.get(
    "/{product_id}",
    response_class=JSONResponse,
    summary="Get Product by ID",
    description="Retrieve a specific product by its ID with category details"
)
async def get_product(
    product_id: int,
    db: DbSession
):
    """
    Get a product by ID.

    Returns product details including category information.

    - **product_id**: The unique identifier of the product
    """
    service = ProductService(db)
    result = await service.get_product_by_id(product_id)
    return success_response(
        message="Product retrieved successfully",
        data=result
    )
