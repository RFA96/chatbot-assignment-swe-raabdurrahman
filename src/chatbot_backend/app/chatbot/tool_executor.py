"""Tool executor for e-commerce API calls.

This module executes the tool calls requested by the AI model,
making actual API calls to the e-commerce backend.
"""
import httpx
from typing import Any, Dict, Optional, List
from dataclasses import dataclass
import logging

from app.chatbot.tools import GIFT_CATEGORY_MAPPING, VAGUE_QUERY_MAPPING

logger = logging.getLogger(__name__)


@dataclass
class ToolExecutionContext:
    """Context for tool execution including authentication and API base URL."""
    api_base_url: str
    auth_token: Optional[str] = None
    customer_id: Optional[int] = None


class EcommerceToolExecutor:
    """Executor for e-commerce API tool calls."""

    def __init__(self, context: ToolExecutionContext):
        self.context = context
        self.client = httpx.AsyncClient(
            base_url=context.api_base_url,
            timeout=30.0
        )

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers including authentication if available."""
        headers = {"Content-Type": "application/json"}
        if self.context.auth_token:
            headers["Authorization"] = f"Bearer {self.context.auth_token}"
        return headers

    async def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a tool call and return the result.

        Args:
            tool_name: Name of the tool to execute
            arguments: Arguments for the tool

        Returns:
            Tool execution result dictionary
        """
        executor_map = {
            "search_products": self._search_products,
            "get_product_details": self._get_product_details,
            "get_categories": self._get_categories,
            "get_products_by_category": self._get_products_by_category,
            "get_brands": self._get_brands,
            "find_product_by_name": self._find_product_by_name,
            "check_stock": self._check_stock,
            "check_stock_by_name": self._check_stock_by_name,
            "get_cart": self._get_cart,
            "add_to_cart": self._add_to_cart,
            "remove_from_cart": self._remove_from_cart,
            "clear_cart": self._clear_cart,
            "get_vouchers": self._get_vouchers,
            "apply_voucher": self._apply_voucher,
            "remove_voucher": self._remove_voucher,
            "get_addresses": self._get_addresses,
            "find_address_by_label": self._find_address_by_label,
            "checkout": self._checkout,
            "get_orders": self._get_orders,
            "get_order_details": self._get_order_details,
            "compare_products": self._compare_products,
            "get_gift_suggestions": self._get_gift_suggestions,
        }

        executor = executor_map.get(tool_name)
        if not executor:
            return {"error": f"Unknown tool: {tool_name}"}

        try:
            result = await executor(arguments)
            return {"success": True, "data": result}
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error executing {tool_name}: {e}")
            return {"success": False, "error": str(e.response.json().get("message", str(e)))}
        except Exception as e:
            logger.error(f"Error executing {tool_name}: {e}")
            return {"success": False, "error": str(e)}

    async def _search_products(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Search for products with filters."""
        params = {}
        if args.get("search"):
            params["search"] = args["search"]
        if args.get("category_id"):
            params["category_id"] = args["category_id"]
        if args.get("brand"):
            params["brand"] = args["brand"]
        if args.get("department"):
            params["department"] = args["department"]
        if args.get("min_price") is not None:
            params["min_price"] = args["min_price"]
        if args.get("max_price") is not None:
            params["max_price"] = args["max_price"]
        if args.get("page"):
            params["page"] = args["page"]
        if args.get("page_size"):
            params["page_size"] = args["page_size"]

        response = await self.client.get("/products", params=params)
        response.raise_for_status()
        return response.json().get("data", {})

    async def _get_product_details(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get details for a specific product."""
        product_id = args["product_id"]
        response = await self.client.get(f"/products/{product_id}")
        response.raise_for_status()
        return response.json().get("data", {})

    async def _get_categories(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get all product categories."""
        response = await self.client.get("/categories")
        response.raise_for_status()
        return response.json().get("data", {})

    async def _get_products_by_category(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get products in a specific category."""
        category_id = args["category_id"]
        params = {}
        if args.get("page"):
            params["page"] = args["page"]
        if args.get("page_size"):
            params["page_size"] = args["page_size"]

        response = await self.client.get(
            f"/categories/{category_id}/products",
            params=params
        )
        response.raise_for_status()
        return response.json().get("data", {})

    async def _get_brands(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get all available brands."""
        response = await self.client.get("/products/brands")
        response.raise_for_status()
        return response.json().get("data", {})

    async def _check_stock(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Check stock availability for a product."""
        product_id = args["product_id"]
        response = await self.client.get(f"/stock/{product_id}")
        response.raise_for_status()
        return response.json().get("data", {})

    async def _find_product_by_name(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Find a product by its name.

        Searches for products matching the given name and returns matching products.
        """
        product_name = args.get("product_name", "")
        params = {
            "search": product_name,
            "page_size": 10
        }

        # Add optional filters
        if args.get("brand"):
            params["brand"] = args["brand"]
        if args.get("department"):
            params["department"] = args["department"]

        response = await self.client.get("/products", params=params)
        response.raise_for_status()
        data = response.json().get("data", {})

        items = data.get("items", [])
        if not items:
            return {
                "found": False,
                "message": f"No products found matching '{product_name}'",
                "search_term": product_name
            }

        # If we found products, return them with details
        return {
            "found": True,
            "products": items,
            "total_found": data.get("total", len(items)),
            "search_term": product_name
        }

    async def _check_stock_by_name(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Check stock availability for a product by searching its name.

        First searches for the product by name, then checks stock for matching products.
        """
        product_name = args.get("product_name", "")
        params = {
            "search": product_name,
            "page_size": 5
        }

        # Add optional filters
        if args.get("brand"):
            params["brand"] = args["brand"]
        if args.get("department"):
            params["department"] = args["department"]

        # First, search for the product
        response = await self.client.get("/products", params=params)
        response.raise_for_status()
        data = response.json().get("data", {})

        items = data.get("items", [])
        if not items:
            return {
                "found": False,
                "message": f"No products found matching '{product_name}'",
                "search_term": product_name
            }

        # Check stock for each found product
        stock_results = []
        for product in items:
            product_id = product.get("product_id")
            try:
                stock_response = await self.client.get(f"/stock/{product_id}")
                stock_response.raise_for_status()
                stock_data = stock_response.json().get("data", {})
                stock_results.append({
                    "product_id": product_id,
                    "product_name": product.get("product_name"),
                    "product_brand": product.get("product_brand"),
                    "retail_price": product.get("retail_price"),
                    "department": product.get("department"),
                    "stock_quantity": stock_data.get("stock_quantity"),
                    "available_quantity": stock_data.get("available_quantity"),
                    "stock_status": stock_data.get("stock_status"),
                    "is_in_stock": stock_data.get("stock_status") != "OUT_OF_STOCK"
                })
            except Exception as e:
                logger.error(f"Error checking stock for product {product_id}: {e}")
                stock_results.append({
                    "product_id": product_id,
                    "product_name": product.get("product_name"),
                    "error": "Unable to check stock"
                })

        return {
            "found": True,
            "search_term": product_name,
            "products_with_stock": stock_results,
            "total_found": len(stock_results)
        }

    async def _get_cart(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get current shopping cart."""
        if not self.context.auth_token:
            return {"error": "Authentication required to view cart"}

        response = await self.client.get(
            "/cart",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json().get("data", {})

    async def _add_to_cart(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Add a product to cart."""
        if not self.context.auth_token:
            return {"error": "Authentication required to add to cart"}

        response = await self.client.post(
            "/cart/items",
            json={"product_id": args["product_id"]},
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json().get("data", {})

    async def _remove_from_cart(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Remove an item from cart."""
        if not self.context.auth_token:
            return {"error": "Authentication required to modify cart"}

        order_item_id = args["order_item_id"]
        response = await self.client.delete(
            f"/cart/items/{order_item_id}",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json().get("data", {})

    async def _clear_cart(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Clear all items from cart."""
        if not self.context.auth_token:
            return {"error": "Authentication required to clear cart"}

        response = await self.client.delete(
            "/cart",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json().get("data", {})

    async def _get_vouchers(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get all active vouchers."""
        response = await self.client.get("/orders/vouchers")
        response.raise_for_status()
        return response.json().get("data", {})

    async def _apply_voucher(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Apply a voucher to cart."""
        if not self.context.auth_token:
            return {"error": "Authentication required to apply voucher"}

        response = await self.client.post(
            "/orders/cart/voucher",
            json={"voucher_code": args["voucher_code"]},
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json().get("data", {})

    async def _remove_voucher(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Remove voucher from cart."""
        if not self.context.auth_token:
            return {"error": "Authentication required to remove voucher"}

        response = await self.client.delete(
            "/orders/cart/voucher",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json().get("data", {})

    async def _get_addresses(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get customer's saved addresses."""
        if not self.context.auth_token:
            return {"error": "Authentication required to view addresses"}

        response = await self.client.get(
            "/addresses",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json().get("data", {})

    async def _find_address_by_label(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Find a customer's address by its label.

        Searches through customer's addresses to find one matching the given label.
        """
        if not self.context.auth_token:
            return {"error": "Authentication required to find addresses"}

        label = args.get("label", "").lower()

        # Get all addresses
        response = await self.client.get(
            "/addresses",
            headers=self._get_headers()
        )
        response.raise_for_status()
        data = response.json().get("data", {})

        addresses = data.get("items", [])
        if not addresses:
            return {
                "found": False,
                "message": "No saved addresses found for this customer",
                "search_label": label
            }

        # Search for matching label (case-insensitive)
        matching_addresses = []
        for addr in addresses:
            addr_label = (addr.get("customer_address_label") or "").lower()
            if label in addr_label or addr_label in label:
                matching_addresses.append(addr)

        if not matching_addresses:
            # Return all addresses so the AI can suggest alternatives
            return {
                "found": False,
                "message": f"No address found with label '{label}'",
                "search_label": label,
                "available_addresses": [
                    {
                        "customer_address_id": addr.get("customer_address_id"),
                        "label": addr.get("customer_address_label"),
                        "street": addr.get("street_address"),
                        "city": addr.get("city")
                    }
                    for addr in addresses
                ]
            }

        # Return the matching address(es)
        return {
            "found": True,
            "search_label": label,
            "matching_addresses": matching_addresses,
            "total_found": len(matching_addresses),
            # Include the first match's ID for easy use
            "recommended_address_id": matching_addresses[0].get("customer_address_id")
        }

    async def _checkout(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Process checkout."""
        if not self.context.auth_token:
            return {"error": "Authentication required to checkout"}

        checkout_data = {
            "shipping_address_id": args["shipping_address_id"]
        }
        if args.get("voucher_code"):
            checkout_data["voucher_code"] = args["voucher_code"]

        response = await self.client.post(
            "/orders/checkout",
            json=checkout_data,
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json().get("data", {})

    async def _get_orders(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get customer's order history."""
        if not self.context.auth_token:
            return {"error": "Authentication required to view orders"}

        params = {}
        if args.get("status"):
            params["status"] = args["status"]
        if args.get("page"):
            params["page"] = args["page"]
        if args.get("page_size"):
            params["page_size"] = args["page_size"]

        response = await self.client.get(
            "/orders",
            params=params,
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json().get("data", {})

    async def _get_order_details(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get details of a specific order."""
        if not self.context.auth_token:
            return {"error": "Authentication required to view order details"}

        order_id = args["order_id"]
        response = await self.client.get(
            f"/orders/{order_id}",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json().get("data", {})

    async def _compare_products(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Compare multiple products."""
        product_ids = args.get("product_ids", [])
        if len(product_ids) < 2:
            return {"error": "At least 2 products are required for comparison"}
        if len(product_ids) > 5:
            return {"error": "Maximum 5 products can be compared at once"}

        products = []
        stock_info = []

        for product_id in product_ids:
            # Get product details
            product_response = await self.client.get(f"/products/{product_id}")
            product_response.raise_for_status()
            products.append(product_response.json().get("data", {}))

            # Get stock info
            stock_response = await self.client.get(f"/stock/{product_id}")
            stock_response.raise_for_status()
            stock_info.append(stock_response.json().get("data", {}))

        return {
            "products": products,
            "stock_info": stock_info,
            "comparison_attributes": [
                "product_name", "product_brand", "retail_price",
                "department", "stock_status"
            ]
        }

    async def _get_gift_suggestions(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get gift suggestions based on recipient and criteria."""
        recipient = args.get("recipient", "").lower()
        budget_max = args.get("budget_max")
        preferences = args.get("preferences", "")

        # Determine relevant categories based on recipient
        categories = GIFT_CATEGORY_MAPPING.get(
            recipient,
            ["Accessories", "Jewelry", "Clothing"]  # Default categories
        )

        # Build search parameters
        search_terms = []
        if preferences:
            search_terms.append(preferences)

        # Check for vague query mapping
        for vague_term, mapped_terms in VAGUE_QUERY_MAPPING.items():
            if vague_term in preferences.lower():
                search_terms.extend(mapped_terms)

        # Search for products
        params = {"page_size": 20}
        if budget_max:
            params["max_price"] = budget_max

        all_products = []

        # Search with different category-related terms
        for category in categories[:3]:  # Limit to 3 categories
            params["search"] = category
            response = await self.client.get("/products", params=params)
            if response.status_code == 200:
                data = response.json().get("data", {})
                items = data.get("items", [])
                all_products.extend(items)

        # Deduplicate and limit results
        seen_ids = set()
        unique_products = []
        for product in all_products:
            if product.get("product_id") not in seen_ids:
                seen_ids.add(product.get("product_id"))
                unique_products.append(product)
                if len(unique_products) >= 10:
                    break

        return {
            "suggestions": unique_products,
            "suggested_categories": categories,
            "recipient": recipient,
            "budget_max": budget_max
        }
