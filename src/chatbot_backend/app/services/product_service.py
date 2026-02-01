from typing import Optional, Dict, Any, List
from math import ceil

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductCategory
from app.core.exceptions import ProductNotFoundError, CategoryNotFoundError

# Product image configuration (using Picsum placeholder)
PRODUCT_IMAGE_BASE_URL = "https://picsum.photos/seed"
PRODUCT_IMAGE_SIZE = 200


def get_product_image_url(product_id: int) -> str:
    """Generate image URL for a product using Picsum."""
    return f"{PRODUCT_IMAGE_BASE_URL}/{product_id}/{PRODUCT_IMAGE_SIZE}/{PRODUCT_IMAGE_SIZE}"


class ProductService:
    """Service for handling product operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_categories(self) -> Dict[str, Any]:
        """
        Get all product categories.

        Returns:
            Dict with list of categories and total count
        """
        # Get all categories
        result = await self.db.execute(
            select(ProductCategory).order_by(ProductCategory.product_category_name)
        )
        categories = result.scalars().all()

        items = [
            {
                "product_category_id": cat.product_category_id,
                "product_category_name": cat.product_category_name,
                "created_at": cat.created_at
            }
            for cat in categories
        ]

        return {
            "items": items,
            "total": len(items)
        }

    async def get_category_by_id(self, category_id: str) -> Dict[str, Any]:
        """
        Get a category by ID.

        Args:
            category_id: Category identifier

        Returns:
            Category data

        Raises:
            CategoryNotFoundError: If category doesn't exist
        """
        result = await self.db.execute(
            select(ProductCategory).where(
                ProductCategory.product_category_id == category_id
            )
        )
        category = result.scalar_one_or_none()

        if not category:
            raise CategoryNotFoundError()

        return {
            "product_category_id": category.product_category_id,
            "product_category_name": category.product_category_name,
            "created_at": category.created_at
        }

    async def get_products(
        self,
        category_id: Optional[str] = None,
        brand: Optional[str] = None,
        department: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        Get products with filtering and pagination.

        Args:
            category_id: Filter by category ID
            brand: Filter by brand name
            department: Filter by department (Men/Women)
            min_price: Minimum price filter
            max_price: Maximum price filter
            search: Search by product name
            page: Page number (1-indexed)
            page_size: Items per page

        Returns:
            Dict with paginated product list
        """
        # Build base query
        query = select(Product)
        count_query = select(func.count(Product.product_id))

        # Build filter conditions
        conditions = []

        if category_id:
            conditions.append(Product.product_category_id == category_id)

        if brand:
            conditions.append(Product.product_brand.ilike(f"%{brand}%"))

        if department:
            conditions.append(Product.department == department)

        if min_price is not None:
            conditions.append(Product.retail_price >= min_price)

        if max_price is not None:
            conditions.append(Product.retail_price <= max_price)

        if search:
            conditions.append(Product.product_name.ilike(f"%{search}%"))

        # Apply conditions
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Calculate pagination
        total_pages = ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size

        # Get products with pagination
        query = query.order_by(Product.product_id).offset(offset).limit(page_size)
        result = await self.db.execute(query)
        products = result.scalars().all()

        items = [
            {
                "product_id": prod.product_id,
                "product_category_id": prod.product_category_id,
                "product_name": prod.product_name,
                "product_brand": prod.product_brand,
                "retail_price": prod.retail_price,
                "department": prod.department,
                "image_url": get_product_image_url(prod.product_id),
                "created_at": prod.created_at
            }
            for prod in products
        ]

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }

    async def get_product_by_id(self, product_id: int) -> Dict[str, Any]:
        """
        Get a product by ID with category details.

        Args:
            product_id: Product identifier

        Returns:
            Product data with category details

        Raises:
            ProductNotFoundError: If product doesn't exist
        """
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.category))
            .where(Product.product_id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise ProductNotFoundError()

        category_data = None
        if product.category:
            category_data = {
                "product_category_id": product.category.product_category_id,
                "product_category_name": product.category.product_category_name,
                "created_at": product.category.created_at
            }

        return {
            "product_id": product.product_id,
            "product_name": product.product_name,
            "product_brand": product.product_brand,
            "retail_price": product.retail_price,
            "department": product.department,
            "image_url": get_product_image_url(product.product_id),
            "category": category_data,
            "created_at": product.created_at
        }

    async def get_products_by_category(
        self,
        category_id: str,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        Get products by category ID.

        Args:
            category_id: Category identifier
            page: Page number
            page_size: Items per page

        Returns:
            Paginated products in category

        Raises:
            CategoryNotFoundError: If category doesn't exist
        """
        # Verify category exists
        cat_result = await self.db.execute(
            select(ProductCategory).where(
                ProductCategory.product_category_id == category_id
            )
        )
        if not cat_result.scalar_one_or_none():
            raise CategoryNotFoundError()

        # Get products
        return await self.get_products(
            category_id=category_id,
            page=page,
            page_size=page_size
        )

    async def get_brands(self) -> List[str]:
        """
        Get all unique product brands.

        Returns:
            List of brand names
        """
        result = await self.db.execute(
            select(Product.product_brand)
            .where(Product.product_brand.isnot(None))
            .distinct()
            .order_by(Product.product_brand)
        )
        brands = result.scalars().all()
        return [b for b in brands if b]

    async def get_departments(self) -> List[str]:
        """
        Get all unique departments.

        Returns:
            List of department names
        """
        result = await self.db.execute(
            select(Product.department)
            .where(Product.department.isnot(None))
            .distinct()
            .order_by(Product.department)
        )
        departments = result.scalars().all()
        return [d for d in departments if d]
