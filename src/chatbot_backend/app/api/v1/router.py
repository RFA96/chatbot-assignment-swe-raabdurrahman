from fastapi import APIRouter

from app.api.v1.endpoints import (
    customer_auth,
    admin_auth,
    health,
    categories,
    products,
    cart,
    orders,
    addresses,
    stock,
    chatbot
)

api_router = APIRouter()

api_router.include_router(
    health.router,
    prefix="/health",
    tags=["Health"]
)

api_router.include_router(
    customer_auth.router,
    prefix="/customer/auth",
    tags=["Customer Authentication"]
)

api_router.include_router(
    admin_auth.router,
    prefix="/admin/auth",
    tags=["Admin Authentication"]
)

api_router.include_router(
    categories.router,
    prefix="/categories",
    tags=["Product Categories"]
)

api_router.include_router(
    products.router,
    prefix="/products",
    tags=["Products"]
)

api_router.include_router(
    cart.router,
    prefix="/cart",
    tags=["Shopping Cart"]
)

api_router.include_router(
    orders.router,
    prefix="/orders",
    tags=["Orders"]
)

api_router.include_router(
    addresses.router,
    prefix="/addresses",
    tags=["Customer Addresses"]
)

api_router.include_router(
    stock.router,
    prefix="/stock",
    tags=["Stock Management"]
)

api_router.include_router(
    chatbot.router,
    prefix="/chatbot",
    tags=["AI Chatbot"]
)
