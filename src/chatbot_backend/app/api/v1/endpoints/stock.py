from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.api.deps import DbSession, CurrentAdmin
from app.services.stock_service import StockService
from app.schemas.stock import (
    AddStockRequest,
    RemoveStockRequest,
    AdjustStockRequest,
    UpdateStockSettingsRequest
)
from app.utils.response_utils import success_response

router = APIRouter()


@router.get(
    "/low-stock",
    response_class=JSONResponse,
    summary="Get Low Stock Products",
    description="Retrieve all products with low or zero stock (Admin only)"
)
async def get_low_stock_products(
    db: DbSession,
    admin: CurrentAdmin
):
    """
    Get all products with low or zero stock.

    Returns products where stock_quantity <= low_stock_threshold.
    Only products with is_track_stock=true are included.

    Requires admin authentication.
    """
    service = StockService(db)
    result = await service.get_low_stock_products()
    return success_response(
        message="Low stock products retrieved successfully",
        data=result
    )


@router.get(
    "/{product_id}",
    response_class=JSONResponse,
    summary="Get Product Stock",
    description="Retrieve stock information for a specific product"
)
async def get_product_stock(
    product_id: int,
    db: DbSession
):
    """
    Get stock information for a product.

    Returns:
    - **stock_quantity**: Total stock available
    - **reserved_quantity**: Stock reserved for pending orders
    - **available_quantity**: Stock available for purchase
    - **stock_status**: IN_STOCK, LOW_STOCK, or OUT_OF_STOCK
    """
    service = StockService(db)
    result = await service.get_product_stock(product_id)
    return success_response(
        message="Stock information retrieved successfully",
        data=result
    )


@router.get(
    "/{product_id}/movements",
    response_class=JSONResponse,
    summary="Get Stock Movements",
    description="Retrieve stock movement history for a product (Admin only)"
)
async def get_stock_movements(
    product_id: int,
    db: DbSession,
    admin: CurrentAdmin,
    movement_type: Optional[str] = Query(
        None,
        description="Filter by movement type (IN, OUT, RESERVED, RELEASED, ADJUSTMENT)"
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
    Get stock movement history for a product.

    Movement types:
    - **IN**: Stock added (replenishment)
    - **OUT**: Stock removed (sold/shipped)
    - **RESERVED**: Stock reserved for pending order
    - **RELEASED**: Stock released from cancelled order
    - **ADJUSTMENT**: Manual inventory adjustment

    Requires admin authentication.
    """
    service = StockService(db)
    result = await service.get_stock_movements(
        product_id=product_id,
        movement_type=movement_type,
        page=page,
        page_size=page_size
    )
    return success_response(
        message="Stock movements retrieved successfully",
        data=result
    )


@router.post(
    "/{product_id}/add",
    response_class=JSONResponse,
    summary="Add Stock",
    description="Add stock to a product (Admin only)"
)
async def add_stock(
    product_id: int,
    request: AddStockRequest,
    db: DbSession,
    admin: CurrentAdmin
):
    """
    Add stock to a product (stock in).

    Use this for:
    - Receiving new inventory from suppliers
    - Restocking products
    - Adding returned items back to inventory

    Requires admin authentication.
    """
    service = StockService(db)
    result = await service.add_stock(
        product_id=product_id,
        quantity=request.quantity,
        notes=request.notes,
        reference_type="MANUAL",
        created_by=admin.username
    )
    return success_response(
        message="Stock added successfully",
        data=result,
        status_code=201
    )


@router.post(
    "/{product_id}/remove",
    response_class=JSONResponse,
    summary="Remove Stock",
    description="Remove stock from a product (Admin only)"
)
async def remove_stock(
    product_id: int,
    request: RemoveStockRequest,
    db: DbSession,
    admin: CurrentAdmin
):
    """
    Remove stock from a product (stock out).

    Use this for:
    - Removing damaged goods
    - Writing off lost inventory
    - Manual stock reduction

    Requires admin authentication.
    """
    service = StockService(db)
    result = await service.remove_stock(
        product_id=product_id,
        quantity=request.quantity,
        notes=request.notes,
        reference_type="MANUAL",
        created_by=admin.username
    )
    return success_response(
        message="Stock removed successfully",
        data=result
    )


@router.post(
    "/{product_id}/adjust",
    response_class=JSONResponse,
    summary="Adjust Stock",
    description="Adjust stock to a specific quantity (Admin only)"
)
async def adjust_stock(
    product_id: int,
    request: AdjustStockRequest,
    db: DbSession,
    admin: CurrentAdmin
):
    """
    Adjust stock to a specific quantity.

    Use this for:
    - Inventory count corrections
    - Reconciling physical vs system inventory
    - Setting initial stock levels

    Requires admin authentication.
    """
    service = StockService(db)
    result = await service.adjust_stock(
        product_id=product_id,
        new_quantity=request.new_quantity,
        notes=request.notes,
        created_by=admin.username
    )
    return success_response(
        message="Stock adjusted successfully",
        data=result
    )


@router.patch(
    "/{product_id}/settings",
    response_class=JSONResponse,
    summary="Update Stock Settings",
    description="Update stock tracking settings for a product (Admin only)"
)
async def update_stock_settings(
    product_id: int,
    request: UpdateStockSettingsRequest,
    db: DbSession,
    admin: CurrentAdmin
):
    """
    Update stock settings for a product.

    Settings:
    - **low_stock_threshold**: Alert threshold for low stock
    - **is_track_stock**: Enable/disable stock tracking

    Requires admin authentication.
    """
    service = StockService(db)
    result = await service.update_stock_settings(
        product_id=product_id,
        low_stock_threshold=request.low_stock_threshold,
        is_track_stock=request.is_track_stock,
        updated_by=admin.username
    )
    return success_response(
        message="Stock settings updated successfully",
        data=result
    )
