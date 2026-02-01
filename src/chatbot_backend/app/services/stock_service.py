from typing import Optional, Dict, Any, List
from datetime import datetime
from math import ceil
import hashlib

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductCategory, StockMovement
from app.core.exceptions import (
    ProductNotFoundError,
    InsufficientStockError,
    InvalidStockOperationError,
    StockMovementNotFoundError
)


class StockService:
    """Service for handling stock/inventory operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_movement_id(self) -> str:
        """Generate a unique stock movement ID."""
        now = datetime.utcnow()
        date_str = now.strftime("%Y%m%d")
        hash_input = f"{now.isoformat()}-{id(self)}"
        hash_str = hashlib.md5(hash_input.encode()).hexdigest()[:12]
        return f"stockmov_{date_str}_{hash_str}"

    async def get_product_stock(self, product_id: int) -> Dict[str, Any]:
        """
        Get stock information for a product.

        Args:
            product_id: Product identifier

        Returns:
            Dict with stock information

        Raises:
            ProductNotFoundError: If product doesn't exist
        """
        result = await self.db.execute(
            select(Product).where(Product.product_id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise ProductNotFoundError()

        return {
            "product_id": product.product_id,
            "product_name": product.product_name,
            "stock_quantity": product.stock_quantity,
            "reserved_quantity": product.reserved_quantity,
            "available_quantity": product.available_quantity,
            "low_stock_threshold": product.low_stock_threshold,
            "is_track_stock": product.is_track_stock,
            "stock_status": product.stock_status
        }

    async def get_low_stock_products(self) -> Dict[str, Any]:
        """
        Get all products with low or zero stock.

        Returns:
            Dict with list of low stock products
        """
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.category))
            .where(
                and_(
                    Product.is_track_stock == True,
                    Product.stock_quantity <= Product.low_stock_threshold
                )
            )
            .order_by(Product.stock_quantity)
        )
        products = result.scalars().all()

        items = [
            {
                "product_id": prod.product_id,
                "product_name": prod.product_name,
                "product_brand": prod.product_brand,
                "product_category_name": prod.category.product_category_name if prod.category else None,
                "stock_quantity": prod.stock_quantity,
                "reserved_quantity": prod.reserved_quantity,
                "available_quantity": prod.available_quantity,
                "low_stock_threshold": prod.low_stock_threshold,
                "stock_status": prod.stock_status
            }
            for prod in products
        ]

        return {
            "items": items,
            "total": len(items)
        }

    async def add_stock(
        self,
        product_id: int,
        quantity: int,
        notes: Optional[str] = None,
        reference_type: str = "MANUAL",
        reference_id: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Add stock to a product (stock in).

        Args:
            product_id: Product identifier
            quantity: Quantity to add (positive)
            notes: Optional notes
            reference_type: Reference type (MANUAL, IMPORT, RETURN)
            reference_id: Optional reference ID
            created_by: User performing the operation

        Returns:
            Dict with operation result

        Raises:
            ProductNotFoundError: If product doesn't exist
        """
        if quantity <= 0:
            raise InvalidStockOperationError("Quantity must be positive")

        result = await self.db.execute(
            select(Product).where(Product.product_id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise ProductNotFoundError()

        quantity_before = product.stock_quantity
        product.stock_quantity += quantity
        product.updated_at = datetime.utcnow()
        product.updated_by = created_by

        # Create stock movement record
        movement = StockMovement(
            stock_movement_id=self._generate_movement_id(),
            product_id=product_id,
            movement_type="IN",
            quantity=quantity,
            quantity_before=quantity_before,
            quantity_after=product.stock_quantity,
            reference_type=reference_type,
            reference_id=reference_id,
            notes=notes,
            created_by=created_by,
            created_at=datetime.utcnow()
        )
        self.db.add(movement)
        await self.db.commit()

        return {
            "product_id": product_id,
            "movement_id": movement.stock_movement_id,
            "movement_type": "IN",
            "quantity_changed": quantity,
            "previous_stock": quantity_before,
            "current_stock": product.stock_quantity,
            "message": "Stock added successfully"
        }

    async def remove_stock(
        self,
        product_id: int,
        quantity: int,
        notes: Optional[str] = None,
        reference_type: str = "MANUAL",
        reference_id: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Remove stock from a product (stock out).

        Args:
            product_id: Product identifier
            quantity: Quantity to remove (positive)
            notes: Optional notes
            reference_type: Reference type (ORDER, MANUAL)
            reference_id: Optional reference ID
            created_by: User performing the operation

        Returns:
            Dict with operation result

        Raises:
            ProductNotFoundError: If product doesn't exist
            InsufficientStockError: If not enough stock
        """
        if quantity <= 0:
            raise InvalidStockOperationError("Quantity must be positive")

        result = await self.db.execute(
            select(Product).where(Product.product_id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise ProductNotFoundError()

        if product.stock_quantity < quantity:
            raise InsufficientStockError(
                f"Insufficient stock. Available: {product.stock_quantity}, Requested: {quantity}"
            )

        quantity_before = product.stock_quantity
        product.stock_quantity -= quantity
        product.updated_at = datetime.utcnow()
        product.updated_by = created_by

        # Create stock movement record
        movement = StockMovement(
            stock_movement_id=self._generate_movement_id(),
            product_id=product_id,
            movement_type="OUT",
            quantity=quantity,
            quantity_before=quantity_before,
            quantity_after=product.stock_quantity,
            reference_type=reference_type,
            reference_id=reference_id,
            notes=notes,
            created_by=created_by,
            created_at=datetime.utcnow()
        )
        self.db.add(movement)
        await self.db.commit()

        return {
            "product_id": product_id,
            "movement_id": movement.stock_movement_id,
            "movement_type": "OUT",
            "quantity_changed": quantity,
            "previous_stock": quantity_before,
            "current_stock": product.stock_quantity,
            "message": "Stock removed successfully"
        }

    async def adjust_stock(
        self,
        product_id: int,
        new_quantity: int,
        notes: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Adjust stock to a specific quantity.

        Args:
            product_id: Product identifier
            new_quantity: New stock quantity
            notes: Reason for adjustment
            created_by: User performing the operation

        Returns:
            Dict with operation result

        Raises:
            ProductNotFoundError: If product doesn't exist
        """
        if new_quantity < 0:
            raise InvalidStockOperationError("Quantity cannot be negative")

        result = await self.db.execute(
            select(Product).where(Product.product_id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise ProductNotFoundError()

        quantity_before = product.stock_quantity
        quantity_diff = abs(new_quantity - quantity_before)

        if quantity_diff == 0:
            return {
                "product_id": product_id,
                "movement_id": None,
                "movement_type": "ADJUSTMENT",
                "quantity_changed": 0,
                "previous_stock": quantity_before,
                "current_stock": new_quantity,
                "message": "No adjustment needed, stock is already at target quantity"
            }

        product.stock_quantity = new_quantity
        product.updated_at = datetime.utcnow()
        product.updated_by = created_by

        # Create stock movement record
        movement = StockMovement(
            stock_movement_id=self._generate_movement_id(),
            product_id=product_id,
            movement_type="ADJUSTMENT",
            quantity=quantity_diff,
            quantity_before=quantity_before,
            quantity_after=new_quantity,
            reference_type="MANUAL",
            reference_id=None,
            notes=notes or f"Stock adjusted from {quantity_before} to {new_quantity}",
            created_by=created_by,
            created_at=datetime.utcnow()
        )
        self.db.add(movement)
        await self.db.commit()

        return {
            "product_id": product_id,
            "movement_id": movement.stock_movement_id,
            "movement_type": "ADJUSTMENT",
            "quantity_changed": quantity_diff,
            "previous_stock": quantity_before,
            "current_stock": new_quantity,
            "message": "Stock adjusted successfully"
        }

    async def reserve_stock(
        self,
        product_id: int,
        quantity: int,
        order_id: Optional[int] = None,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Reserve stock for an order.

        Args:
            product_id: Product identifier
            quantity: Quantity to reserve
            order_id: Order ID reference
            created_by: User performing the operation

        Returns:
            Dict with operation result

        Raises:
            ProductNotFoundError: If product doesn't exist
            InsufficientStockError: If not enough available stock
        """
        if quantity <= 0:
            raise InvalidStockOperationError("Quantity must be positive")

        result = await self.db.execute(
            select(Product).where(Product.product_id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise ProductNotFoundError()

        available = product.available_quantity
        if available < quantity:
            raise InsufficientStockError(
                f"Insufficient available stock. Available: {available}, Requested: {quantity}"
            )

        quantity_before = product.reserved_quantity
        product.reserved_quantity += quantity
        product.updated_at = datetime.utcnow()
        product.updated_by = created_by

        # Create stock movement record
        movement = StockMovement(
            stock_movement_id=self._generate_movement_id(),
            product_id=product_id,
            movement_type="RESERVED",
            quantity=quantity,
            quantity_before=product.stock_quantity,
            quantity_after=product.stock_quantity,
            reference_type="ORDER",
            reference_id=str(order_id) if order_id else None,
            notes=f"Reserved for order {order_id}" if order_id else "Stock reserved",
            created_by=created_by,
            created_at=datetime.utcnow()
        )
        self.db.add(movement)
        await self.db.commit()

        return {
            "product_id": product_id,
            "movement_id": movement.stock_movement_id,
            "movement_type": "RESERVED",
            "quantity_changed": quantity,
            "previous_stock": product.stock_quantity,
            "current_stock": product.stock_quantity,
            "message": "Stock reserved successfully"
        }

    async def release_stock(
        self,
        product_id: int,
        quantity: int,
        order_id: Optional[int] = None,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Release reserved stock (e.g., when order is cancelled).

        Args:
            product_id: Product identifier
            quantity: Quantity to release
            order_id: Order ID reference
            created_by: User performing the operation

        Returns:
            Dict with operation result

        Raises:
            ProductNotFoundError: If product doesn't exist
            InvalidStockOperationError: If trying to release more than reserved
        """
        if quantity <= 0:
            raise InvalidStockOperationError("Quantity must be positive")

        result = await self.db.execute(
            select(Product).where(Product.product_id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise ProductNotFoundError()

        if product.reserved_quantity < quantity:
            raise InvalidStockOperationError(
                f"Cannot release more than reserved. Reserved: {product.reserved_quantity}"
            )

        product.reserved_quantity -= quantity
        product.updated_at = datetime.utcnow()
        product.updated_by = created_by

        # Create stock movement record
        movement = StockMovement(
            stock_movement_id=self._generate_movement_id(),
            product_id=product_id,
            movement_type="RELEASED",
            quantity=quantity,
            quantity_before=product.stock_quantity,
            quantity_after=product.stock_quantity,
            reference_type="ORDER",
            reference_id=str(order_id) if order_id else None,
            notes=f"Released from order {order_id}" if order_id else "Stock released",
            created_by=created_by,
            created_at=datetime.utcnow()
        )
        self.db.add(movement)
        await self.db.commit()

        return {
            "product_id": product_id,
            "movement_id": movement.stock_movement_id,
            "movement_type": "RELEASED",
            "quantity_changed": quantity,
            "previous_stock": product.stock_quantity,
            "current_stock": product.stock_quantity,
            "message": "Stock released successfully"
        }

    async def update_stock_settings(
        self,
        product_id: int,
        low_stock_threshold: Optional[int] = None,
        is_track_stock: Optional[bool] = None,
        updated_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update stock settings for a product.

        Args:
            product_id: Product identifier
            low_stock_threshold: New low stock threshold
            is_track_stock: Enable/disable stock tracking
            updated_by: User performing the update

        Returns:
            Dict with updated stock info

        Raises:
            ProductNotFoundError: If product doesn't exist
        """
        result = await self.db.execute(
            select(Product).where(Product.product_id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise ProductNotFoundError()

        if low_stock_threshold is not None:
            product.low_stock_threshold = low_stock_threshold

        if is_track_stock is not None:
            product.is_track_stock = is_track_stock

        product.updated_at = datetime.utcnow()
        product.updated_by = updated_by

        await self.db.commit()

        return {
            "product_id": product.product_id,
            "product_name": product.product_name,
            "stock_quantity": product.stock_quantity,
            "reserved_quantity": product.reserved_quantity,
            "available_quantity": product.available_quantity,
            "low_stock_threshold": product.low_stock_threshold,
            "is_track_stock": product.is_track_stock,
            "stock_status": product.stock_status
        }

    async def get_stock_movements(
        self,
        product_id: int,
        movement_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        Get stock movement history for a product.

        Args:
            product_id: Product identifier
            movement_type: Filter by movement type
            page: Page number
            page_size: Items per page

        Returns:
            Dict with paginated movement history

        Raises:
            ProductNotFoundError: If product doesn't exist
        """
        # Verify product exists
        prod_result = await self.db.execute(
            select(Product).where(Product.product_id == product_id)
        )
        if not prod_result.scalar_one_or_none():
            raise ProductNotFoundError()

        # Build query
        query = select(StockMovement).where(StockMovement.product_id == product_id)
        count_query = select(func.count(StockMovement.stock_movement_id)).where(
            StockMovement.product_id == product_id
        )

        if movement_type:
            query = query.where(StockMovement.movement_type == movement_type)
            count_query = count_query.where(StockMovement.movement_type == movement_type)

        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Calculate pagination
        total_pages = ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size

        # Get movements with pagination
        query = query.order_by(StockMovement.created_at.desc()).offset(offset).limit(page_size)
        result = await self.db.execute(query)
        movements = result.scalars().all()

        items = [
            {
                "stock_movement_id": mov.stock_movement_id,
                "product_id": mov.product_id,
                "movement_type": mov.movement_type,
                "quantity": mov.quantity,
                "quantity_before": mov.quantity_before,
                "quantity_after": mov.quantity_after,
                "reference_type": mov.reference_type,
                "reference_id": mov.reference_id,
                "notes": mov.notes,
                "created_by": mov.created_by,
                "created_at": mov.created_at
            }
            for mov in movements
        ]

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
