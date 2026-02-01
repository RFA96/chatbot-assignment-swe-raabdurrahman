"""E-commerce API tool definitions for Google GenAI function calling.

This module defines the tools that the AI model can invoke to interact
with the e-commerce backend APIs. Each tool corresponds to an API endpoint
defined in the API.md documentation.
"""
from google.genai import types
from typing import List


def get_ecommerce_tools() -> List[types.Tool]:
    """Get all e-commerce tools for the chatbot.

    Returns:
        List of Tool objects containing function declarations
    """
    function_declarations = [
        # Product Search and Discovery
        types.FunctionDeclaration(
            name="search_products",
            description="""Search for products in the e-commerce catalog with optional filters.
            Use this when the user wants to find products, browse items, or search for specific products.
            Supports filtering by category, brand, department, price range, and text search.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "search": {
                        "type": "string",
                        "description": "Search term to find products by name (partial match supported)"
                    },
                    "category_id": {
                        "type": "string",
                        "description": "Filter by category ID"
                    },
                    "brand": {
                        "type": "string",
                        "description": "Filter by brand name (partial match supported)"
                    },
                    "department": {
                        "type": "string",
                        "enum": ["Men", "Women"],
                        "description": "Filter by department (Men or Women)"
                    },
                    "min_price": {
                        "type": "number",
                        "description": "Minimum price filter"
                    },
                    "max_price": {
                        "type": "number",
                        "description": "Maximum price filter"
                    },
                    "page": {
                        "type": "integer",
                        "description": "Page number for pagination (default: 1)"
                    },
                    "page_size": {
                        "type": "integer",
                        "description": "Number of items per page (default: 10, max: 100)"
                    }
                },
                "required": []
            }
        ),

        types.FunctionDeclaration(
            name="get_product_details",
            description="""Get detailed information about a specific product.
            Use this when the user wants to know more about a particular product,
            see its full details, or when comparing products.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "integer",
                        "description": "The unique identifier of the product"
                    }
                },
                "required": ["product_id"]
            }
        ),

        types.FunctionDeclaration(
            name="get_categories",
            description="""Get all available product categories.
            Use this when the user wants to browse by category or needs to know
            what categories are available in the store.""",
            parameters_json_schema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),

        types.FunctionDeclaration(
            name="get_products_by_category",
            description="""Get all products in a specific category.
            Use this when the user wants to browse products within a particular category.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "category_id": {
                        "type": "string",
                        "description": "The category ID to get products from"
                    },
                    "page": {
                        "type": "integer",
                        "description": "Page number for pagination"
                    },
                    "page_size": {
                        "type": "integer",
                        "description": "Number of items per page"
                    }
                },
                "required": ["category_id"]
            }
        ),

        types.FunctionDeclaration(
            name="get_brands",
            description="""Get all available product brands.
            Use this when the user asks about available brands or wants to filter by brand.""",
            parameters_json_schema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),

        # Find Product by Name
        types.FunctionDeclaration(
            name="find_product_by_name",
            description="""Find a product by its name and return the matching product(s).
            Use this when the user mentions a specific product by name and you need to find
            its product_id or details. This is useful when the user asks about a product
            without providing the product ID.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "product_name": {
                        "type": "string",
                        "description": "The product name to search for (partial or full name)"
                    },
                    "brand": {
                        "type": "string",
                        "description": "Optional brand name to narrow down the search"
                    },
                    "department": {
                        "type": "string",
                        "enum": ["Men", "Women"],
                        "description": "Optional department filter"
                    }
                },
                "required": ["product_name"]
            }
        ),

        # Stock and Availability
        types.FunctionDeclaration(
            name="check_stock",
            description="""Check stock availability for a specific product by product ID.
            Use this when you already have the product_id and want to check stock status.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "integer",
                        "description": "The product ID to check stock for"
                    }
                },
                "required": ["product_id"]
            }
        ),

        types.FunctionDeclaration(
            name="check_stock_by_name",
            description="""Check stock availability for a product by searching its name.
            Use this when the user asks about product availability or stock status
            by mentioning the product name instead of product ID. This tool will search
            for the product by name and return stock information.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "product_name": {
                        "type": "string",
                        "description": "The product name to search for and check stock"
                    },
                    "brand": {
                        "type": "string",
                        "description": "Optional brand name to narrow down the search"
                    },
                    "department": {
                        "type": "string",
                        "enum": ["Men", "Women"],
                        "description": "Optional department filter"
                    }
                },
                "required": ["product_name"]
            }
        ),

        # Shopping Cart Operations
        types.FunctionDeclaration(
            name="get_cart",
            description="""Get the current shopping cart contents.
            Use this when the user wants to see their cart, check what's in their cart,
            or review items before checkout. Requires authentication.""",
            parameters_json_schema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),

        types.FunctionDeclaration(
            name="add_to_cart",
            description="""Add a product to the shopping cart.
            Use this when the user wants to add an item to their cart.
            Requires authentication.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "integer",
                        "description": "The product ID to add to cart"
                    }
                },
                "required": ["product_id"]
            }
        ),

        types.FunctionDeclaration(
            name="remove_from_cart",
            description="""Remove an item from the shopping cart.
            Use this when the user wants to remove a specific item from their cart.
            Requires authentication.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "order_item_id": {
                        "type": "string",
                        "description": "The order item ID to remove from cart"
                    }
                },
                "required": ["order_item_id"]
            }
        ),

        types.FunctionDeclaration(
            name="clear_cart",
            description="""Clear all items from the shopping cart.
            Use this when the user wants to empty their entire cart.
            Requires authentication.""",
            parameters_json_schema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),

        # Voucher Operations
        types.FunctionDeclaration(
            name="get_vouchers",
            description="""Get all active and valid vouchers/discount codes.
            Use this when the user asks about available discounts, promo codes,
            or wants to know what vouchers they can use.""",
            parameters_json_schema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),

        types.FunctionDeclaration(
            name="apply_voucher",
            description="""Apply a voucher/discount code to the shopping cart.
            Use this when the user wants to apply a promo code or discount.
            Requires authentication.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "voucher_code": {
                        "type": "string",
                        "description": "The voucher code to apply"
                    }
                },
                "required": ["voucher_code"]
            }
        ),

        types.FunctionDeclaration(
            name="remove_voucher",
            description="""Remove the applied voucher from the shopping cart.
            Use this when the user wants to remove a discount code.
            Requires authentication.""",
            parameters_json_schema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),

        # Order Operations
        types.FunctionDeclaration(
            name="get_addresses",
            description="""Get customer's saved shipping addresses.
            Use this when preparing for checkout or when the user asks about
            their saved addresses. Requires authentication.""",
            parameters_json_schema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),

        types.FunctionDeclaration(
            name="find_address_by_label",
            description="""Find a customer's address by its label (e.g., "Home", "Office", "Work").
            Use this when the user mentions an address by name/label instead of providing the address ID.
            For example, when user says "send to my home" or "use my office address".
            Requires authentication.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "label": {
                        "type": "string",
                        "description": "The address label to search for (e.g., 'Home', 'Office', 'Work')"
                    }
                },
                "required": ["label"]
            }
        ),

        types.FunctionDeclaration(
            name="checkout",
            description="""Process checkout and place an order.
            Use this when the user is ready to complete their purchase.
            Requires authentication and a shipping address.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "shipping_address_id": {
                        "type": "string",
                        "description": "The customer's shipping address ID"
                    },
                    "voucher_code": {
                        "type": "string",
                        "description": "Optional voucher code to apply at checkout"
                    }
                },
                "required": ["shipping_address_id"]
            }
        ),

        types.FunctionDeclaration(
            name="get_orders",
            description="""Get customer's order history.
            Use this when the user wants to see their past orders or check order status.
            Requires authentication.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["Processing", "Shipped", "Delivered", "Complete", "Cancelled", "Returned"],
                        "description": "Filter orders by status"
                    },
                    "page": {
                        "type": "integer",
                        "description": "Page number for pagination"
                    },
                    "page_size": {
                        "type": "integer",
                        "description": "Number of items per page"
                    }
                },
                "required": []
            }
        ),

        types.FunctionDeclaration(
            name="get_order_details",
            description="""Get details of a specific order.
            Use this when the user wants to see details of a particular order.
            Requires authentication.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "integer",
                        "description": "The order ID to get details for"
                    }
                },
                "required": ["order_id"]
            }
        ),

        # Comparison and Recommendation Tools
        types.FunctionDeclaration(
            name="compare_products",
            description="""Compare multiple products side by side.
            Use this when the user wants to compare two or more products,
            understand differences between items, or make a decision between options.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "product_ids": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "List of product IDs to compare (2-5 products)"
                    }
                },
                "required": ["product_ids"]
            }
        ),

        types.FunctionDeclaration(
            name="get_gift_suggestions",
            description="""Get product suggestions for gifts based on criteria.
            Use this when the user is looking for gift ideas or needs recommendations
            for someone else. Maps vague queries to relevant product categories.""",
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "recipient": {
                        "type": "string",
                        "description": "Who the gift is for (e.g., 'girlfriend', 'mother', 'friend')"
                    },
                    "occasion": {
                        "type": "string",
                        "description": "The occasion (e.g., 'birthday', 'anniversary', 'christmas')"
                    },
                    "budget_max": {
                        "type": "number",
                        "description": "Maximum budget for the gift"
                    },
                    "preferences": {
                        "type": "string",
                        "description": "Any known preferences or interests"
                    }
                },
                "required": ["recipient"]
            }
        )
    ]

    return [types.Tool(function_declarations=function_declarations)]


# Category mapping for gift suggestions
GIFT_CATEGORY_MAPPING = {
    "girlfriend": ["Jewelry", "Perfume", "Accessories", "Clothing", "Bags"],
    "boyfriend": ["Electronics", "Watches", "Clothing", "Accessories", "Sports"],
    "mother": ["Jewelry", "Perfume", "Home", "Bags", "Clothing"],
    "father": ["Electronics", "Watches", "Clothing", "Sports", "Tools"],
    "friend": ["Accessories", "Electronics", "Books", "Sports", "Clothing"],
    "wife": ["Jewelry", "Perfume", "Bags", "Clothing", "Accessories"],
    "husband": ["Electronics", "Watches", "Clothing", "Sports", "Accessories"],
    "child": ["Toys", "Books", "Games", "Clothing", "Electronics"],
    "teen": ["Electronics", "Games", "Clothing", "Accessories", "Sports"],
}

# Search term mapping for vague queries
VAGUE_QUERY_MAPPING = {
    "gift": ["accessories", "jewelry", "perfume", "watches"],
    "present": ["accessories", "jewelry", "perfume", "watches"],
    "something nice": ["jewelry", "accessories", "clothing"],
    "surprise": ["jewelry", "perfume", "accessories", "electronics"],
    "romantic": ["jewelry", "perfume", "accessories"],
    "special": ["jewelry", "watches", "perfume"],
}
