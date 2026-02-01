from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.exceptions import (
    AuthenticationError,
    InvalidCredentialsError,
    UserNotFoundError,
    SessionExpiredError,
    SessionNotFoundError,
    ProductNotFoundError,
    CategoryNotFoundError,
    CartItemNotFoundError,
    CartNotFoundError,
    VoucherNotFoundError,
    VoucherInvalidError,
    VoucherMinPurchaseError,
    VoucherUsageLimitError,
    AddressNotFoundError,
    CartEmptyError,
    OrderNotFoundError
)
from app.api.v1.router import api_router
from app.utils.response_utils import error_response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    yield
    # Shutdown


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Backend API for Chatbot Application with JWT Authentication",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handlers
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            errors.append({
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"]
            })
        return error_response(
            message="Validation error",
            status_code=422,
            errors=errors
        )

    @app.exception_handler(AuthenticationError)
    async def authentication_exception_handler(request: Request, exc: AuthenticationError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(InvalidCredentialsError)
    async def invalid_credentials_exception_handler(request: Request, exc: InvalidCredentialsError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(UserNotFoundError)
    async def user_not_found_exception_handler(request: Request, exc: UserNotFoundError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(SessionExpiredError)
    async def session_expired_exception_handler(request: Request, exc: SessionExpiredError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(SessionNotFoundError)
    async def session_not_found_exception_handler(request: Request, exc: SessionNotFoundError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(ProductNotFoundError)
    async def product_not_found_exception_handler(request: Request, exc: ProductNotFoundError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(CategoryNotFoundError)
    async def category_not_found_exception_handler(request: Request, exc: CategoryNotFoundError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(CartItemNotFoundError)
    async def cart_item_not_found_exception_handler(request: Request, exc: CartItemNotFoundError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(CartNotFoundError)
    async def cart_not_found_exception_handler(request: Request, exc: CartNotFoundError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(VoucherNotFoundError)
    async def voucher_not_found_exception_handler(request: Request, exc: VoucherNotFoundError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(VoucherInvalidError)
    async def voucher_invalid_exception_handler(request: Request, exc: VoucherInvalidError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(VoucherMinPurchaseError)
    async def voucher_min_purchase_exception_handler(request: Request, exc: VoucherMinPurchaseError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(VoucherUsageLimitError)
    async def voucher_usage_limit_exception_handler(request: Request, exc: VoucherUsageLimitError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(AddressNotFoundError)
    async def address_not_found_exception_handler(request: Request, exc: AddressNotFoundError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(CartEmptyError)
    async def cart_empty_exception_handler(request: Request, exc: CartEmptyError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(OrderNotFoundError)
    async def order_not_found_exception_handler(request: Request, exc: OrderNotFoundError):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        return error_response(
            message="Internal server error",
            status_code=500
        )

    # Include API router
    app.include_router(api_router, prefix="/api/v1")

    return app


app = create_application()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
