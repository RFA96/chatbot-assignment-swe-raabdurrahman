from typing import Dict, Any, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.address import CustomerAddress
from app.core.exceptions import AddressNotFoundError


class AddressService:
    """Service for handling customer address operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_addresses(self, customer: Customer) -> Dict[str, Any]:
        """
        Get all addresses for a customer.

        Args:
            customer: Customer object

        Returns:
            Dict with list of addresses and total count
        """
        result = await self.db.execute(
            select(CustomerAddress)
            .where(CustomerAddress.customer_id == customer.customer_id)
            .order_by(CustomerAddress.created_at.desc())
        )
        addresses = result.scalars().all()

        items = [
            {
                "customer_address_id": addr.customer_address_id,
                "customer_id": addr.customer_id,
                "customer_address_label": addr.customer_address_label,
                "street_address": addr.street_address,
                "city": addr.city,
                "state": addr.state,
                "postal_code": addr.postal_code,
                "country": addr.country,
                "latitude": addr.latitude,
                "longitude": addr.longitude,
                "created_at": addr.created_at
            }
            for addr in addresses
        ]

        return {
            "items": items,
            "total": len(items)
        }

    async def get_address_by_id(
        self,
        customer: Customer,
        address_id: str
    ) -> Dict[str, Any]:
        """
        Get a specific address by ID.

        Args:
            customer: Customer object
            address_id: Address identifier

        Returns:
            Address data

        Raises:
            AddressNotFoundError: If address doesn't exist
        """
        result = await self.db.execute(
            select(CustomerAddress).where(
                CustomerAddress.customer_address_id == address_id,
                CustomerAddress.customer_id == customer.customer_id
            )
        )
        address = result.scalar_one_or_none()

        if not address:
            raise AddressNotFoundError()

        return {
            "customer_address_id": address.customer_address_id,
            "customer_id": address.customer_id,
            "customer_address_label": address.customer_address_label,
            "street_address": address.street_address,
            "city": address.city,
            "state": address.state,
            "postal_code": address.postal_code,
            "country": address.country,
            "latitude": address.latitude,
            "longitude": address.longitude,
            "created_at": address.created_at
        }
