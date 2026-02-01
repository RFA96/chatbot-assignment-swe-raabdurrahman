from fastapi import HTTPException, status


class AuthenticationError(HTTPException):
    """Raised when authentication fails."""

    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class InvalidCredentialsError(HTTPException):
    """Raised when login credentials are invalid."""

    def __init__(self, detail: str = "Invalid email or password"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )


class UserNotFoundError(HTTPException):
    """Raised when user is not found."""

    def __init__(self, detail: str = "User not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class SessionExpiredError(HTTPException):
    """Raised when session has expired."""

    def __init__(self, detail: str = "Session has expired"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class SessionNotFoundError(HTTPException):
    """Raised when session is not found."""

    def __init__(self, detail: str = "Session not found"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class ProductNotFoundError(HTTPException):
    """Raised when product is not found."""

    def __init__(self, detail: str = "Product not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class CategoryNotFoundError(HTTPException):
    """Raised when category is not found."""

    def __init__(self, detail: str = "Category not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class CartItemNotFoundError(HTTPException):
    """Raised when cart item is not found."""

    def __init__(self, detail: str = "Cart item not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class CartNotFoundError(HTTPException):
    """Raised when cart is not found."""

    def __init__(self, detail: str = "Cart not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class VoucherNotFoundError(HTTPException):
    """Raised when voucher is not found."""

    def __init__(self, detail: str = "Voucher not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class VoucherInvalidError(HTTPException):
    """Raised when voucher is invalid or expired."""

    def __init__(self, detail: str = "Voucher is invalid or expired"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class VoucherMinPurchaseError(HTTPException):
    """Raised when cart total doesn't meet voucher minimum purchase."""

    def __init__(self, detail: str = "Cart total does not meet minimum purchase requirement"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class VoucherUsageLimitError(HTTPException):
    """Raised when voucher usage limit has been reached."""

    def __init__(self, detail: str = "Voucher usage limit has been reached"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class AddressNotFoundError(HTTPException):
    """Raised when address is not found."""

    def __init__(self, detail: str = "Address not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class CartEmptyError(HTTPException):
    """Raised when trying to checkout an empty cart."""

    def __init__(self, detail: str = "Cannot checkout an empty cart"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class OrderNotFoundError(HTTPException):
    """Raised when order is not found."""

    def __init__(self, detail: str = "Order not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class InsufficientStockError(HTTPException):
    """Raised when there is not enough stock available."""

    def __init__(self, detail: str = "Insufficient stock available"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class StockMovementNotFoundError(HTTPException):
    """Raised when stock movement is not found."""

    def __init__(self, detail: str = "Stock movement not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class InvalidStockOperationError(HTTPException):
    """Raised when stock operation is invalid."""

    def __init__(self, detail: str = "Invalid stock operation"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )
