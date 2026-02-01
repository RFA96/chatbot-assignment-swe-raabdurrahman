from datetime import datetime
from typing import Dict, Any
import hashlib

from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.core.exceptions import (
    ProductNotFoundError,
    CartItemNotFoundError,
    CartNotFoundError
)


class CartService:
    """Service for handling shopping cart operations."""

    ORDER_STATUS_CART = "Cart"

    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_order_item_id(self) -> str:
        """
        Generate a unique order item ID.

        Format: orderitem_yyyymmdd_md5hash

        Returns:
            Unique order item ID
        """
        now = datetime.utcnow()
        date_str = now.strftime("%Y%m%d")
        timestamp_str = now.strftime("%Y%m%d%H%M%S%f")
        hash_str = hashlib.md5(timestamp_str.encode()).hexdigest()[:12]
        return f"orderitem_{date_str}_{hash_str}"

    async def _get_or_create_cart(self, customer: Customer) -> Order:
        """
        Get existing cart or create a new one for the customer.

        Args:
            customer: Customer object

        Returns:
            Order object with status 'Cart'
        """
        # Find existing cart
        result = await self.db.execute(
            select(Order).where(
                Order.customer_id == customer.customer_id,
                Order.status == self.ORDER_STATUS_CART
            )
        )
        cart = result.scalar_one_or_none()

        if not cart:
            # Create new cart with next order_id
            max_id_result = await self.db.execute(
                select(func.max(Order.order_id))
            )
            max_id = max_id_result.scalar() or 0
            new_order_id = max_id + 1

            cart = Order(
                order_id=new_order_id,
                customer_id=customer.customer_id,
                status=self.ORDER_STATUS_CART,
                num_of_item=0,
                created_by=customer.email,
                created_at=datetime.utcnow()
            )
            self.db.add(cart)
            await self.db.flush()

        return cart

    async def get_cart(self, customer: Customer) -> Dict[str, Any]:
        """
        Get the customer's cart with all items.

        Args:
            customer: Customer object

        Returns:
            Cart data with items and totals
        """
        # Get or create cart
        cart = await self._get_or_create_cart(customer)

        # Get cart items with product details
        result = await self.db.execute(
            select(OrderItem)
            .options(selectinload(OrderItem.product))
            .where(
                OrderItem.order_id == cart.order_id,
                OrderItem.customer_id == customer.customer_id
            )
        )
        order_items = result.scalars().all()

        items = []
        total_price = 0.0

        for item in order_items:
            product = item.product
            item_data = {
                "order_item_id": item.order_item_id,
                "product_id": item.product_id,
                "product_name": product.product_name if product else None,
                "product_brand": product.product_brand if product else None,
                "retail_price": product.retail_price if product else None,
                "department": product.department if product else None
            }
            items.append(item_data)

            if product and product.retail_price:
                total_price += product.retail_price

        return {
            "order_id": cart.order_id,
            "customer_id": customer.customer_id,
            "status": cart.status,
            "items": items,
            "num_of_item": len(items),
            "total_price": round(total_price, 2),
            "created_at": cart.created_at
        }

    async def add_to_cart(
        self,
        customer: Customer,
        product_id: int
    ) -> Dict[str, Any]:
        """
        Add a product to the customer's cart.

        Args:
            customer: Customer object
            product_id: Product ID to add

        Returns:
            Dict with order item details

        Raises:
            ProductNotFoundError: If product doesn't exist
        """
        # Verify product exists
        product_result = await self.db.execute(
            select(Product).where(Product.product_id == product_id)
        )
        product = product_result.scalar_one_or_none()

        if not product:
            raise ProductNotFoundError()

        # Get or create cart
        cart = await self._get_or_create_cart(customer)

        # Create order item
        order_item_id = self._generate_order_item_id()
        order_item = OrderItem(
            order_item_id=order_item_id,
            order_id=cart.order_id,
            customer_id=customer.customer_id,
            product_id=product_id
        )

        self.db.add(order_item)

        # Update cart item count
        item_count_result = await self.db.execute(
            select(func.count(OrderItem.order_item_id)).where(
                OrderItem.order_id == cart.order_id
            )
        )
        new_count = (item_count_result.scalar() or 0) + 1
        cart.num_of_item = new_count
        cart.updated_at = datetime.utcnow()
        cart.updated_by = customer.email

        await self.db.commit()

        return {
            "order_item_id": order_item_id,
            "order_id": cart.order_id,
            "product_id": product_id,
            "message": "Product added to cart successfully"
        }

    async def remove_from_cart(
        self,
        customer: Customer,
        order_item_id: str
    ) -> Dict[str, Any]:
        """
        Remove an item from the cart.

        Args:
            customer: Customer object
            order_item_id: Order item ID to remove

        Returns:
            Dict with removed item info

        Raises:
            CartItemNotFoundError: If cart item doesn't exist
        """
        # Find the order item
        result = await self.db.execute(
            select(OrderItem).where(
                OrderItem.order_item_id == order_item_id,
                OrderItem.customer_id == customer.customer_id
            )
        )
        order_item = result.scalar_one_or_none()

        if not order_item:
            raise CartItemNotFoundError()

        # Get the cart to update count
        cart_result = await self.db.execute(
            select(Order).where(Order.order_id == order_item.order_id)
        )
        cart = cart_result.scalar_one_or_none()

        # Delete the item
        await self.db.execute(
            delete(OrderItem).where(
                OrderItem.order_item_id == order_item_id
            )
        )

        # Update cart item count
        if cart:
            new_count = max(0, (cart.num_of_item or 1) - 1)
            cart.num_of_item = new_count
            cart.updated_at = datetime.utcnow()
            cart.updated_by = customer.email

        await self.db.commit()

        return {
            "order_item_id": order_item_id,
            "message": "Product removed from cart successfully"
        }

    async def clear_cart(self, customer: Customer) -> Dict[str, Any]:
        """
        Clear all items from the customer's cart.

        Args:
            customer: Customer object

        Returns:
            Dict with clear cart info

        Raises:
            CartNotFoundError: If cart doesn't exist
        """
        # Find the cart
        result = await self.db.execute(
            select(Order).where(
                Order.customer_id == customer.customer_id,
                Order.status == self.ORDER_STATUS_CART
            )
        )
        cart = result.scalar_one_or_none()

        if not cart:
            raise CartNotFoundError()

        # Count items before deletion
        count_result = await self.db.execute(
            select(func.count(OrderItem.order_item_id)).where(
                OrderItem.order_id == cart.order_id
            )
        )
        items_count = count_result.scalar() or 0

        # Delete all items
        await self.db.execute(
            delete(OrderItem).where(
                OrderItem.order_id == cart.order_id,
                OrderItem.customer_id == customer.customer_id
            )
        )

        # Update cart
        cart.num_of_item = 0
        cart.updated_at = datetime.utcnow()
        cart.updated_by = customer.email

        await self.db.commit()

        return {
            "order_id": cart.order_id,
            "items_removed": items_count,
            "message": "Cart cleared successfully"
        }

    async def get_cart_item_count(self, customer: Customer) -> int:
        """
        Get the number of items in the customer's cart.

        Args:
            customer: Customer object

        Returns:
            Number of items in cart
        """
        result = await self.db.execute(
            select(Order).where(
                Order.customer_id == customer.customer_id,
                Order.status == self.ORDER_STATUS_CART
            )
        )
        cart = result.scalar_one_or_none()

        if not cart:
            return 0

        count_result = await self.db.execute(
            select(func.count(OrderItem.order_item_id)).where(
                OrderItem.order_id == cart.order_id
            )
        )
        return count_result.scalar() or 0
