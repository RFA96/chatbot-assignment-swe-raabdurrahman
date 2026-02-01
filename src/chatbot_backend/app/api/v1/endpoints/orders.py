from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.api.deps import DbSession, CurrentCustomer
from app.schemas.order import CheckoutRequest
from app.schemas.voucher import ApplyVoucherRequest
from app.services.order_service import OrderService
from app.utils.response_utils import success_response

router = APIRouter()


@router.get(
    "/vouchers",
    response_class=JSONResponse,
    summary="Get Active Vouchers",
    description="Retrieve all active and valid vouchers"
)
async def get_active_vouchers(db: DbSession):
    """
    Get all active vouchers.

    Returns vouchers that are:
    - Active (is_active = true)
    - Currently valid (within valid_from and valid_until dates)
    - Not exceeded usage limit

    This endpoint does not require authentication.
    """
    service = OrderService(db)
    result = await service.get_active_vouchers()
    return success_response(
        message="Vouchers retrieved successfully",
        data=result
    )


@router.post(
    "/checkout",
    response_class=JSONResponse,
    summary="Checkout Cart",
    description="Process checkout - convert cart to processing order"
)
async def checkout(
    checkout_data: CheckoutRequest,
    current_customer: CurrentCustomer,
    db: DbSession
):
    """
    Process checkout for the current cart.

    - **shipping_address_id**: Customer's shipping address ID
    - **voucher_code**: Optional voucher code to apply

    Converts cart status from 'Cart' to 'Processing'.
    Requires authentication.
    """
    service = OrderService(db)
    result = await service.checkout(
        customer=current_customer,
        shipping_address_id=checkout_data.shipping_address_id,
        voucher_code=checkout_data.voucher_code
    )
    return success_response(
        message="Order placed successfully",
        data=result,
        status_code=201
    )


@router.post(
    "/cart/voucher",
    response_class=JSONResponse,
    summary="Apply Voucher to Cart",
    description="Apply a voucher/coupon code to the shopping cart"
)
async def apply_voucher(
    voucher_data: ApplyVoucherRequest,
    current_customer: CurrentCustomer,
    db: DbSession
):
    """
    Apply a voucher to the cart.

    - **voucher_code**: The voucher code to apply

    Calculates and updates the discount on the cart.
    Requires authentication.
    """
    service = OrderService(db)
    result = await service.apply_voucher(
        customer=current_customer,
        voucher_code=voucher_data.voucher_code
    )
    return success_response(
        message="Voucher applied successfully",
        data=result
    )


@router.delete(
    "/cart/voucher",
    response_class=JSONResponse,
    summary="Remove Voucher from Cart",
    description="Remove the applied voucher from the shopping cart"
)
async def remove_voucher(
    current_customer: CurrentCustomer,
    db: DbSession
):
    """
    Remove voucher from the cart.

    Removes any applied voucher and recalculates totals.
    Requires authentication.
    """
    service = OrderService(db)
    result = await service.remove_voucher(customer=current_customer)
    return success_response(
        message="Voucher removed successfully",
        data=result
    )


@router.get(
    "",
    response_class=JSONResponse,
    summary="Get Orders",
    description="Retrieve customer's orders with optional filtering"
)
async def get_orders(
    current_customer: CurrentCustomer,
    db: DbSession,
    status: Optional[str] = Query(
        None,
        description="Filter by order status (Processing, Shipped, Delivered, Complete, Cancelled, Returned)"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page")
):
    """
    Get customer's orders.

    - **status**: Optional filter by order status
    - **page**: Page number (starts from 1)
    - **page_size**: Items per page (max 100)

    Returns orders excluding 'Cart' status (active shopping cart).
    Requires authentication.
    """
    service = OrderService(db)
    result = await service.get_orders(
        customer=current_customer,
        status=status,
        page=page,
        page_size=page_size
    )
    return success_response(
        message="Orders retrieved successfully",
        data=result
    )


@router.get(
    "/{order_id}",
    response_class=JSONResponse,
    summary="Get Order by ID",
    description="Retrieve a specific order by its ID"
)
async def get_order(
    order_id: int,
    current_customer: CurrentCustomer,
    db: DbSession
):
    """
    Get order details by ID.

    - **order_id**: The order ID

    Returns full order details including items, voucher, and shipping address.
    Requires authentication.
    """
    service = OrderService(db)
    result = await service.get_order(
        customer=current_customer,
        order_id=order_id
    )
    return success_response(
        message="Order retrieved successfully",
        data=result
    )
