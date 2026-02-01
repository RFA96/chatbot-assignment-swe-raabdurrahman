from datetime import datetime
from typing import Dict, Any, Optional, List
from math import ceil

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.voucher import Voucher
from app.models.address import CustomerAddress
from app.core.exceptions import (
    CartNotFoundError,
    CartEmptyError,
    VoucherNotFoundError,
    VoucherInvalidError,
    VoucherMinPurchaseError,
    VoucherUsageLimitError,
    AddressNotFoundError,
    OrderNotFoundError
)


class OrderService:
    """Service for handling order and checkout operations."""

    ORDER_STATUS_CART = "Cart"
    ORDER_STATUS_PROCESSING = "Processing"
    ORDER_STATUS_SHIPPED = "Shipped"
    ORDER_STATUS_DELIVERED = "Delivered"
    ORDER_STATUS_COMPLETE = "Complete"
    ORDER_STATUS_CANCELLED = "Cancelled"
    ORDER_STATUS_RETURNED = "Returned"

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_cart(self, customer: Customer) -> Order:
        """Get customer's cart."""
        result = await self.db.execute(
            select(Order).where(
                Order.customer_id == customer.customer_id,
                Order.status == self.ORDER_STATUS_CART
            )
        )
        cart = result.scalar_one_or_none()

        if not cart:
            raise CartNotFoundError()

        return cart

    async def _calculate_cart_subtotal(self, cart: Order) -> float:
        """Calculate cart subtotal from items."""
        result = await self.db.execute(
            select(OrderItem)
            .options(selectinload(OrderItem.product))
            .where(OrderItem.order_id == cart.order_id)
        )
        items = result.scalars().all()

        subtotal = 0.0
        for item in items:
            if item.product and item.product.retail_price:
                subtotal += item.product.retail_price

        return round(subtotal, 2)

    async def _validate_voucher(
        self,
        voucher_code: str,
        subtotal: float
    ) -> Voucher:
        """Validate voucher and return if valid."""
        result = await self.db.execute(
            select(Voucher).where(Voucher.voucher_code == voucher_code)
        )
        voucher = result.scalar_one_or_none()

        if not voucher:
            raise VoucherNotFoundError()

        now = datetime.utcnow()

        # Check if active
        if not voucher.is_active:
            raise VoucherInvalidError("Voucher is not active")

        # Check validity period
        if voucher.valid_from and now < voucher.valid_from:
            raise VoucherInvalidError("Voucher is not yet valid")

        if voucher.valid_until and now > voucher.valid_until:
            raise VoucherInvalidError("Voucher has expired")

        # Check usage limit
        if voucher.usage_limit and voucher.used_count >= voucher.usage_limit:
            raise VoucherUsageLimitError()

        # Check minimum purchase
        if voucher.min_purchase_amount and subtotal < voucher.min_purchase_amount:
            raise VoucherMinPurchaseError(
                f"Minimum purchase amount is {voucher.min_purchase_amount}"
            )

        return voucher

    def _calculate_discount(self, voucher: Voucher, subtotal: float) -> float:
        """Calculate discount amount based on voucher."""
        if voucher.discount_type == "percentage":
            discount = subtotal * (voucher.discount_value / 100)
            # Apply max discount limit if exists
            if voucher.max_discount_amount:
                discount = min(discount, voucher.max_discount_amount)
        else:  # fixed
            discount = voucher.discount_value

        # Discount cannot exceed subtotal
        discount = min(discount, subtotal)

        return round(discount, 2)

    async def apply_voucher(
        self,
        customer: Customer,
        voucher_code: str
    ) -> Dict[str, Any]:
        """
        Apply a voucher to the cart.

        Args:
            customer: Customer object
            voucher_code: Voucher code to apply

        Returns:
            Dict with voucher and pricing details

        Raises:
            CartNotFoundError: If cart doesn't exist
            VoucherNotFoundError: If voucher doesn't exist
            VoucherInvalidError: If voucher is invalid/expired
            VoucherMinPurchaseError: If minimum purchase not met
            VoucherUsageLimitError: If usage limit reached
        """
        cart = await self._get_cart(customer)
        subtotal = await self._calculate_cart_subtotal(cart)

        voucher = await self._validate_voucher(voucher_code, subtotal)
        discount_amount = self._calculate_discount(voucher, subtotal)
        total_amount = round(subtotal - discount_amount, 2)

        # Update cart with voucher
        cart.voucher_id = voucher.voucher_id
        cart.subtotal = subtotal
        cart.discount_amount = discount_amount
        cart.total_amount = total_amount
        cart.updated_at = datetime.utcnow()
        cart.updated_by = customer.email

        await self.db.commit()

        return {
            "voucher": {
                "voucher_id": voucher.voucher_id,
                "voucher_code": voucher.voucher_code,
                "voucher_name": voucher.voucher_name,
                "discount_type": voucher.discount_type,
                "discount_value": voucher.discount_value,
                "min_purchase_amount": voucher.min_purchase_amount,
                "max_discount_amount": voucher.max_discount_amount,
                "valid_from": voucher.valid_from,
                "valid_until": voucher.valid_until
            },
            "subtotal": subtotal,
            "discount_amount": discount_amount,
            "total_amount": total_amount,
            "message": "Voucher applied successfully"
        }

    async def remove_voucher(self, customer: Customer) -> Dict[str, Any]:
        """
        Remove voucher from cart.

        Args:
            customer: Customer object

        Returns:
            Dict with updated pricing

        Raises:
            CartNotFoundError: If cart doesn't exist
        """
        cart = await self._get_cart(customer)
        subtotal = await self._calculate_cart_subtotal(cart)

        # Remove voucher
        cart.voucher_id = None
        cart.subtotal = subtotal
        cart.discount_amount = 0
        cart.total_amount = subtotal
        cart.updated_at = datetime.utcnow()
        cart.updated_by = customer.email

        await self.db.commit()

        return {
            "subtotal": subtotal,
            "total_amount": subtotal,
            "message": "Voucher removed successfully"
        }

    async def checkout(
        self,
        customer: Customer,
        shipping_address_id: str,
        voucher_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process checkout - convert cart to processing order.

        Args:
            customer: Customer object
            shipping_address_id: Shipping address ID
            voucher_code: Optional voucher code to apply

        Returns:
            Dict with order details

        Raises:
            CartNotFoundError: If cart doesn't exist
            CartEmptyError: If cart is empty
            AddressNotFoundError: If address doesn't exist
            VoucherNotFoundError: If voucher doesn't exist
            VoucherInvalidError: If voucher is invalid
        """
        # Get cart
        cart = await self._get_cart(customer)

        # Check if cart has items
        item_count_result = await self.db.execute(
            select(func.count(OrderItem.order_item_id)).where(
                OrderItem.order_id == cart.order_id
            )
        )
        item_count = item_count_result.scalar() or 0

        if item_count == 0:
            raise CartEmptyError()

        # Validate shipping address
        address_result = await self.db.execute(
            select(CustomerAddress).where(
                CustomerAddress.customer_address_id == shipping_address_id,
                CustomerAddress.customer_id == customer.customer_id
            )
        )
        address = address_result.scalar_one_or_none()

        if not address:
            raise AddressNotFoundError()

        # Calculate subtotal
        subtotal = await self._calculate_cart_subtotal(cart)

        # Apply voucher if provided
        voucher = None
        discount_amount = 0.0

        if voucher_code:
            voucher = await self._validate_voucher(voucher_code, subtotal)
            discount_amount = self._calculate_discount(voucher, subtotal)
            # Increment voucher usage
            voucher.used_count = (voucher.used_count or 0) + 1
            voucher.updated_at = datetime.utcnow()

        total_amount = round(subtotal - discount_amount, 2)

        # Update order to Processing status
        cart.status = self.ORDER_STATUS_PROCESSING
        cart.shipping_address_id = shipping_address_id
        cart.voucher_id = voucher.voucher_id if voucher else None
        cart.subtotal = subtotal
        cart.discount_amount = discount_amount
        cart.total_amount = total_amount
        cart.num_of_item = item_count
        cart.updated_at = datetime.utcnow()
        cart.updated_by = customer.email

        await self.db.commit()

        # Get order items for response
        items_result = await self.db.execute(
            select(OrderItem)
            .options(selectinload(OrderItem.product))
            .where(OrderItem.order_id == cart.order_id)
        )
        order_items = items_result.scalars().all()

        items_data = []
        for item in order_items:
            items_data.append({
                "order_item_id": item.order_item_id,
                "product_id": item.product_id,
                "product_name": item.product.product_name if item.product else None,
                "product_brand": item.product.product_brand if item.product else None,
                "retail_price": item.product.retail_price if item.product else None,
                "department": item.product.department if item.product else None
            })

        voucher_data = None
        if voucher:
            voucher_data = {
                "voucher_id": voucher.voucher_id,
                "voucher_code": voucher.voucher_code,
                "voucher_name": voucher.voucher_name,
                "discount_type": voucher.discount_type,
                "discount_value": voucher.discount_value,
                "min_purchase_amount": voucher.min_purchase_amount,
                "max_discount_amount": voucher.max_discount_amount,
                "valid_from": voucher.valid_from,
                "valid_until": voucher.valid_until
            }

        address_data = {
            "customer_address_id": address.customer_address_id,
            "customer_address_label": address.customer_address_label,
            "street_address": address.street_address,
            "city": address.city,
            "state": address.state,
            "postal_code": address.postal_code,
            "country": address.country
        }

        return {
            "order": {
                "order_id": cart.order_id,
                "customer_id": cart.customer_id,
                "status": cart.status,
                "num_of_item": item_count,
                "subtotal": subtotal,
                "discount_amount": discount_amount,
                "total_amount": total_amount,
                "voucher": voucher_data,
                "shipping_address": address_data,
                "items": items_data,
                "created_at": cart.created_at
            },
            "message": "Order placed successfully"
        }

    async def get_order(
        self,
        customer: Customer,
        order_id: int
    ) -> Dict[str, Any]:
        """
        Get order details by ID.

        Args:
            customer: Customer object
            order_id: Order ID

        Returns:
            Order details

        Raises:
            OrderNotFoundError: If order doesn't exist
        """
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.voucher),
                selectinload(Order.shipping_address)
            )
            .where(
                Order.order_id == order_id,
                Order.customer_id == customer.customer_id
            )
        )
        order = result.scalar_one_or_none()

        if not order:
            raise OrderNotFoundError()

        # Get order items
        items_result = await self.db.execute(
            select(OrderItem)
            .options(selectinload(OrderItem.product))
            .where(OrderItem.order_id == order.order_id)
        )
        order_items = items_result.scalars().all()

        items_data = []
        for item in order_items:
            items_data.append({
                "order_item_id": item.order_item_id,
                "product_id": item.product_id,
                "product_name": item.product.product_name if item.product else None,
                "product_brand": item.product.product_brand if item.product else None,
                "retail_price": item.product.retail_price if item.product else None,
                "department": item.product.department if item.product else None
            })

        voucher_data = None
        if order.voucher:
            voucher_data = {
                "voucher_id": order.voucher.voucher_id,
                "voucher_code": order.voucher.voucher_code,
                "voucher_name": order.voucher.voucher_name,
                "discount_type": order.voucher.discount_type,
                "discount_value": order.voucher.discount_value,
                "min_purchase_amount": order.voucher.min_purchase_amount,
                "max_discount_amount": order.voucher.max_discount_amount,
                "valid_from": order.voucher.valid_from,
                "valid_until": order.voucher.valid_until
            }

        address_data = None
        if order.shipping_address:
            address_data = {
                "customer_address_id": order.shipping_address.customer_address_id,
                "customer_address_label": order.shipping_address.customer_address_label,
                "street_address": order.shipping_address.street_address,
                "city": order.shipping_address.city,
                "state": order.shipping_address.state,
                "postal_code": order.shipping_address.postal_code,
                "country": order.shipping_address.country
            }

        return {
            "order_id": order.order_id,
            "customer_id": order.customer_id,
            "status": order.status,
            "num_of_item": order.num_of_item,
            "subtotal": order.subtotal,
            "discount_amount": order.discount_amount,
            "total_amount": order.total_amount,
            "voucher": voucher_data,
            "shipping_address": address_data,
            "items": items_data,
            "created_at": order.created_at,
            "shipped_at": order.shipped_at,
            "delivered_at": order.delivered_at
        }

    async def get_orders(
        self,
        customer: Customer,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        Get customer's orders with optional filtering.

        Args:
            customer: Customer object
            status: Optional status filter
            page: Page number
            page_size: Items per page

        Returns:
            Paginated list of orders
        """
        # Build query
        conditions = [
            Order.customer_id == customer.customer_id,
            Order.status != self.ORDER_STATUS_CART  # Exclude cart
        ]

        if status:
            conditions.append(Order.status == status)

        # Count query
        count_result = await self.db.execute(
            select(func.count(Order.order_id)).where(and_(*conditions))
        )
        total = count_result.scalar() or 0

        # Pagination
        total_pages = ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size

        # Get orders
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.voucher),
                selectinload(Order.shipping_address)
            )
            .where(and_(*conditions))
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        orders = result.scalars().all()

        items = []
        for order in orders:
            # Get order items
            items_result = await self.db.execute(
                select(OrderItem)
                .options(selectinload(OrderItem.product))
                .where(OrderItem.order_id == order.order_id)
            )
            order_items = items_result.scalars().all()

            order_items_data = []
            for item in order_items:
                order_items_data.append({
                    "order_item_id": item.order_item_id,
                    "product_id": item.product_id,
                    "product_name": item.product.product_name if item.product else None,
                    "product_brand": item.product.product_brand if item.product else None,
                    "retail_price": item.product.retail_price if item.product else None,
                    "department": item.product.department if item.product else None
                })

            voucher_data = None
            if order.voucher:
                voucher_data = {
                    "voucher_id": order.voucher.voucher_id,
                    "voucher_code": order.voucher.voucher_code,
                    "voucher_name": order.voucher.voucher_name,
                    "discount_type": order.voucher.discount_type,
                    "discount_value": order.voucher.discount_value
                }

            address_data = None
            if order.shipping_address:
                address_data = {
                    "customer_address_id": order.shipping_address.customer_address_id,
                    "customer_address_label": order.shipping_address.customer_address_label,
                    "city": order.shipping_address.city,
                    "country": order.shipping_address.country
                }

            items.append({
                "order_id": order.order_id,
                "customer_id": order.customer_id,
                "status": order.status,
                "num_of_item": order.num_of_item,
                "subtotal": order.subtotal,
                "discount_amount": order.discount_amount,
                "total_amount": order.total_amount,
                "voucher": voucher_data,
                "shipping_address": address_data,
                "items": order_items_data,
                "created_at": order.created_at,
                "shipped_at": order.shipped_at,
                "delivered_at": order.delivered_at
            })

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }

    async def get_active_vouchers(self) -> Dict[str, Any]:
        """
        Get all active and valid vouchers.

        Returns:
            Dict with list of active vouchers
        """
        now = datetime.utcnow()

        # Query active vouchers that are currently valid
        result = await self.db.execute(
            select(Voucher).where(
                and_(
                    Voucher.is_active == True,
                    or_(
                        Voucher.valid_from.is_(None),
                        Voucher.valid_from <= now
                    ),
                    or_(
                        Voucher.valid_until.is_(None),
                        Voucher.valid_until >= now
                    ),
                    or_(
                        Voucher.usage_limit.is_(None),
                        Voucher.used_count < Voucher.usage_limit
                    )
                )
            ).order_by(Voucher.created_at.desc())
        )
        vouchers = result.scalars().all()

        items = [
            {
                "voucher_id": v.voucher_id,
                "voucher_code": v.voucher_code,
                "voucher_name": v.voucher_name,
                "discount_type": v.discount_type,
                "discount_value": v.discount_value,
                "min_purchase_amount": v.min_purchase_amount,
                "max_discount_amount": v.max_discount_amount,
                "usage_limit": v.usage_limit,
                "used_count": v.used_count,
                "valid_from": v.valid_from,
                "valid_until": v.valid_until
            }
            for v in vouchers
        ]

        return {
            "items": items,
            "total": len(items)
        }
