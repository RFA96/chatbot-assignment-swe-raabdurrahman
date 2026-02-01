from app.schemas.auth import (
    CustomerLoginRequest,
    AdminLoginRequest,
    TokenResponse,
    CustomerProfileResponse,
    AdminProfileResponse,
    LogoutResponse,
    SessionInfo
)
from app.schemas.product import (
    ProductCategoryResponse,
    ProductResponse,
    ProductDetailResponse,
    ProductListResponse,
    CategoryListResponse,
    ProductFilterParams
)
from app.schemas.cart import (
    AddToCartRequest,
    RemoveFromCartRequest,
    CartItemResponse,
    CartResponse,
    AddToCartResponse,
    RemoveFromCartResponse,
    ClearCartResponse
)
from app.schemas.voucher import (
    ApplyVoucherRequest,
    VoucherResponse,
    ApplyVoucherResponse,
    RemoveVoucherResponse
)
from app.schemas.order import (
    ShippingAddressResponse,
    CheckoutRequest,
    OrderResponse,
    CheckoutResponse,
    OrderListResponse
)
from app.schemas.stock import (
    MovementTypeEnum,
    ReferenceTypeEnum,
    StockStatusEnum,
    StockInfoResponse,
    StockMovementResponse,
    StockMovementListResponse,
    LowStockProductResponse,
    LowStockListResponse,
    AddStockRequest,
    RemoveStockRequest,
    AdjustStockRequest,
    UpdateStockSettingsRequest,
    StockOperationResponse
)

__all__ = [
    # Auth schemas
    "CustomerLoginRequest",
    "AdminLoginRequest",
    "TokenResponse",
    "CustomerProfileResponse",
    "AdminProfileResponse",
    "LogoutResponse",
    "SessionInfo",
    # Product schemas
    "ProductCategoryResponse",
    "ProductResponse",
    "ProductDetailResponse",
    "ProductListResponse",
    "CategoryListResponse",
    "ProductFilterParams",
    # Cart schemas
    "AddToCartRequest",
    "RemoveFromCartRequest",
    "CartItemResponse",
    "CartResponse",
    "AddToCartResponse",
    "RemoveFromCartResponse",
    "ClearCartResponse",
    # Voucher schemas
    "ApplyVoucherRequest",
    "VoucherResponse",
    "ApplyVoucherResponse",
    "RemoveVoucherResponse",
    # Order schemas
    "ShippingAddressResponse",
    "CheckoutRequest",
    "OrderResponse",
    "CheckoutResponse",
    "OrderListResponse",
    # Stock schemas
    "MovementTypeEnum",
    "ReferenceTypeEnum",
    "StockStatusEnum",
    "StockInfoResponse",
    "StockMovementResponse",
    "StockMovementListResponse",
    "LowStockProductResponse",
    "LowStockListResponse",
    "AddStockRequest",
    "RemoveStockRequest",
    "AdjustStockRequest",
    "UpdateStockSettingsRequest",
    "StockOperationResponse"
]
