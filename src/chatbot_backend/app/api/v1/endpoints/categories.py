from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.api.deps import DbSession
from app.services.product_service import ProductService
from app.utils.response_utils import success_response

router = APIRouter()


@router.get(
    "",
    response_class=JSONResponse,
    summary="Get All Categories",
    description="Retrieve all product categories"
)
async def get_categories(db: DbSession):
    """
    Get all product categories.

    Returns a list of all available product categories.
    """
    service = ProductService(db)
    result = await service.get_categories()
    return success_response(
        message="Categories retrieved successfully",
        data=result
    )


@router.get(
    "/{category_id}",
    response_class=JSONResponse,
    summary="Get Category by ID",
    description="Retrieve a specific product category by its ID"
)
async def get_category(
    category_id: str,
    db: DbSession
):
    """
    Get a product category by ID.

    - **category_id**: The unique identifier of the category
    """
    service = ProductService(db)
    result = await service.get_category_by_id(category_id)
    return success_response(
        message="Category retrieved successfully",
        data=result
    )


@router.get(
    "/{category_id}/products",
    response_class=JSONResponse,
    summary="Get Products by Category",
    description="Retrieve all products in a specific category"
)
async def get_category_products(
    category_id: str,
    page: int = 1,
    page_size: int = 10,
    db: DbSession = None
):
    """
    Get all products in a category.

    - **category_id**: The unique identifier of the category
    - **page**: Page number (default: 1)
    - **page_size**: Number of items per page (default: 10, max: 100)
    """
    service = ProductService(db)
    result = await service.get_products_by_category(
        category_id=category_id,
        page=page,
        page_size=min(page_size, 100)
    )
    return success_response(
        message="Products retrieved successfully",
        data=result
    )
