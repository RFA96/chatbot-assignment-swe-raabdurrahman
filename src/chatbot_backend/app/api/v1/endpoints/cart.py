from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.api.deps import DbSession, CurrentCustomer
from app.schemas.cart import AddToCartRequest, RemoveFromCartRequest
from app.services.cart_service import CartService
from app.utils.response_utils import success_response

router = APIRouter()


@router.get(
    "",
    response_class=JSONResponse,
    summary="Get Cart",
    description="Retrieve the current customer's shopping cart"
)
async def get_cart(
    current_customer: CurrentCustomer,
    db: DbSession
):
    """
    Get the current customer's cart.

    Returns the cart with all items, quantities, and total price.
    Requires authentication.
    """
    service = CartService(db)
    result = await service.get_cart(current_customer)
    return success_response(
        message="Cart retrieved successfully",
        data=result
    )


@router.post(
    "/items",
    response_class=JSONResponse,
    summary="Add to Cart",
    description="Add a product to the shopping cart"
)
async def add_to_cart(
    cart_data: AddToCartRequest,
    current_customer: CurrentCustomer,
    db: DbSession
):
    """
    Add a product to the cart.

    - **product_id**: The ID of the product to add

    Creates a new cart if one doesn't exist.
    Requires authentication.
    """
    service = CartService(db)
    result = await service.add_to_cart(
        customer=current_customer,
        product_id=cart_data.product_id
    )
    return success_response(
        message="Product added to cart successfully",
        data=result,
        status_code=201
    )


@router.delete(
    "/items/{order_item_id}",
    response_class=JSONResponse,
    summary="Remove from Cart",
    description="Remove an item from the shopping cart"
)
async def remove_from_cart(
    order_item_id: str,
    current_customer: CurrentCustomer,
    db: DbSession
):
    """
    Remove an item from the cart.

    - **order_item_id**: The ID of the order item to remove

    Requires authentication.
    """
    service = CartService(db)
    result = await service.remove_from_cart(
        customer=current_customer,
        order_item_id=order_item_id
    )
    return success_response(
        message="Product removed from cart successfully",
        data=result
    )


@router.delete(
    "",
    response_class=JSONResponse,
    summary="Clear Cart",
    description="Remove all items from the shopping cart"
)
async def clear_cart(
    current_customer: CurrentCustomer,
    db: DbSession
):
    """
    Clear all items from the cart.

    Removes all items but keeps the cart/order record.
    Requires authentication.
    """
    service = CartService(db)
    result = await service.clear_cart(current_customer)
    return success_response(
        message="Cart cleared successfully",
        data=result
    )


@router.get(
    "/count",
    response_class=JSONResponse,
    summary="Get Cart Item Count",
    description="Get the number of items in the shopping cart"
)
async def get_cart_count(
    current_customer: CurrentCustomer,
    db: DbSession
):
    """
    Get the number of items in the cart.

    Requires authentication.
    """
    service = CartService(db)
    count = await service.get_cart_item_count(current_customer)
    return success_response(
        message="Cart count retrieved successfully",
        data={"count": count}
    )
