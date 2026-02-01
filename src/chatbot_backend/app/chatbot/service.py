"""Main chatbot service integrating Google GenAI with e-commerce tools.

This service orchestrates the conversation flow:
1. Receives user message
2. Retrieves conversation history for context
3. Sends to Google GenAI with tool definitions
4. Executes any tool calls
5. Synthesizes final response
6. Stores messages in database
"""
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from app.chatbot.tools import get_ecommerce_tools
from app.chatbot.tool_executor import EcommerceToolExecutor, ToolExecutionContext
from app.services.chat_history_service import ChatHistoryService
from app.core.config import settings

logger = logging.getLogger(__name__)


# System instruction for the shopping assistant
SYSTEM_INSTRUCTION = """You are a friendly and knowledgeable e-commerce shopping assistant. Your role is to help customers find products, answer questions about items, assist with their shopping cart, and guide them through the checkout process.

## Your Capabilities:
1. **Product Discovery**: Help customers find products by searching, browsing categories, and filtering by criteria like price, brand, and department.
2. **Product Information**: Provide detailed information about specific products including pricing, brand, and availability.
3. **Gift Recommendations**: When customers have vague requests like "I need a gift for my girlfriend", proactively suggest relevant categories and products. Map common gift recipients to appropriate product categories.
4. **Product Comparison**: Compare products side-by-side when customers are deciding between options.
5. **Stock Availability**: Check if products are in stock and inform customers about availability.
6. **Cart Management**: Help customers add items to cart, view cart contents, and remove items.
7. **Vouchers & Discounts**: Inform customers about available discount codes and help apply them.
8. **Checkout Assistance**: Guide customers through the checkout process, including selecting shipping addresses and applying vouchers.
9. **Order Tracking**: Help customers view their order history and order details.

## Guidelines:
- Always be helpful, friendly, and professional.
- When searching for products, use appropriate filters based on the customer's request.
- For vague queries like "gift for girlfriend" or "something nice", think creatively about what categories might be relevant and search across multiple categories.
- When displaying products, present them in an engaging way with key details (name, brand, price).
- Always check stock availability when relevant.
- If an action requires authentication (cart, checkout, orders), inform the customer if they need to log in.
- When comparing products, highlight the key differences clearly.
- For checkout assistance, guide step-by-step: cart review -> address selection -> voucher application -> final checkout.
- When a customer asks about discounts or how to apply a code, explain the voucher system and show available vouchers.
- Handle out-of-stock situations gracefully by suggesting alternatives.
- Keep responses concise but informative.
- Use structured formatting when presenting multiple products or comparisons.

## Response Format:
- For product listings, present items clearly with name, brand, price, and availability.
- For comparisons, use a clear side-by-side format.
- For cart and order information, summarize key details.
- Always include actionable next steps when relevant.

## Handling Specific Scenarios:

### Vague Product Search (e.g., "gift for girlfriend"):
1. First, acknowledge the request warmly
2. Suggest relevant categories (Jewelry, Perfume, Accessories, etc.)
3. Search across multiple relevant categories
4. Present diverse options with varying price points
5. Offer to narrow down based on budget or preferences

### Price-Filtered Search (e.g., "jackets under $100"):
1. Extract the category/product type
2. Apply the price filter
3. Present matching products
4. Mention if there are more options at different price points

### Product Comparison:
1. Retrieve details for all products being compared
2. Present a clear comparison of key attributes
3. Highlight pros/cons of each option
4. Check and include stock availability
5. Offer a recommendation if appropriate

### Stock/Availability Questions:
1. If user mentions a product by name (not ID), use check_stock_by_name to find and check stock
2. If user provides product ID, use check_stock directly
3. Report status (In Stock, Low Stock, Out of Stock)
4. If out of stock, suggest similar alternatives
5. Mention available quantity if relevant

### Finding Products by Name:
1. When user asks about a specific product by name, use find_product_by_name first
2. This helps get the product_id needed for other operations like add_to_cart
3. Always confirm with the user if multiple products match the search

### Checkout Assistance:
1. Guide through viewing cart contents
2. Help select or confirm shipping address
3. Explain how to apply vouchers if they have one
4. Confirm final order details
5. Process checkout when ready

### Address by Label (e.g., "send to my home"):
1. When user mentions an address by label (home, office, work, etc.), use find_address_by_label first
2. NEVER guess or make up address IDs - always look up the actual address
3. Use the recommended_address_id from the result for checkout
4. If no matching address found, show available addresses to the user

Remember: You're here to make shopping easy and enjoyable. Be proactive in offering help and suggestions."""


class ChatbotService:
    """Service for handling chatbot conversations."""

    def __init__(
        self,
        db: AsyncSession,
        api_base_url: str,
        auth_token: Optional[str] = None,
        customer_id: Optional[int] = None
    ):
        self.db = db
        self.history_service = ChatHistoryService(db)
        self.api_base_url = api_base_url
        self.auth_token = auth_token
        self.customer_id = customer_id

        # Initialize Google GenAI client
        self._init_genai_client()

    def _init_genai_client(self):
        """Initialize the Google GenAI client based on environment configuration."""
        if settings.GOOGLE_GENAI_USE_VERTEXAI:
            # Use Vertex AI
            self.client = genai.Client(
                vertexai=True,
                project=settings.GOOGLE_CLOUD_PROJECT,
                location=settings.GOOGLE_CLOUD_LOCATION
            )
        else:
            # Use Google AI Studio API
            if not settings.GOOGLE_API_KEY:
                raise ValueError(
                    "GOOGLE_API_KEY is not set. Please set it in your .env file."
                )
            self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)

        self.model = settings.VERTEX_AI_MODEL

    async def chat(
        self,
        message: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a chat message and return the response.

        Args:
            message: User's message
            session_id: Optional existing session ID

        Returns:
            Dictionary containing response, session_id, and metadata
        """
        # Get or create session
        session = await self.history_service.get_or_create_session(
            session_id=session_id,
            customer_id=self.customer_id
        )

        # Store user message
        await self.history_service.add_message(
            session_id=session.chat_session_id,
            role="user",
            content=message
        )

        # Get conversation history for context
        history = await self.history_service.get_recent_context(
            session_id=session.chat_session_id,
            num_messages=20
        )

        # Build conversation contents
        contents = self._build_contents(history)

        # Get tools
        tools = get_ecommerce_tools()

        # Generate response with tools
        response_text, tool_results, token_usage = await self._generate_with_tools(
            contents=contents,
            tools=tools
        )

        # Store assistant response with token usage
        await self.history_service.add_message(
            session_id=session.chat_session_id,
            role="model",
            content=response_text,
            token_usage=token_usage
        )

        # Extract product data if present in tool results
        products = self._extract_products_from_results(tool_results)

        return {
            "session_id": session.chat_session_id,
            "response": response_text,
            "tool_calls": tool_results if tool_results else None,
            "products": products if products else None,
            "token_usage": token_usage,
            "created_at": datetime.utcnow()
        }

    def _build_contents(self, history: List[Dict[str, str]]) -> List[types.Content]:
        """Build conversation contents from history.

        Args:
            history: List of message dictionaries with role and content

        Returns:
            List of Content objects for the API
        """
        contents = []
        for msg in history:
            role = msg["role"]
            # Map 'model' role to 'assistant' for Gemini API
            if role == "model":
                role = "model"
            elif role == "user":
                role = "user"

            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])]
                )
            )
        return contents

    async def _generate_with_tools(
        self,
        contents: List[types.Content],
        tools: List[types.Tool],
        max_iterations: int = 5
    ) -> tuple[str, List[Dict[str, Any]], Dict[str, int]]:
        """Generate response with tool calling loop.

        Args:
            contents: Conversation contents
            tools: Available tools
            max_iterations: Maximum tool calling iterations

        Returns:
            Tuple of (final response text, list of tool results, token usage dict)
        """
        tool_executor = EcommerceToolExecutor(
            ToolExecutionContext(
                api_base_url=self.api_base_url,
                auth_token=self.auth_token,
                customer_id=self.customer_id
            )
        )

        all_tool_results = []
        current_contents = contents.copy()

        # Track accumulated token usage across all iterations
        total_token_usage = {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }

        try:
            for iteration in range(max_iterations):
                # Generate response
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=current_contents,
                    config=types.GenerateContentConfig(
                        tools=tools,
                        system_instruction=SYSTEM_INSTRUCTION,
                        temperature=0.7,
                        max_output_tokens=2048
                    )
                )

                # Accumulate token usage
                if response.usage_metadata:
                    total_token_usage["prompt_tokens"] += response.usage_metadata.prompt_token_count or 0
                    total_token_usage["completion_tokens"] += response.usage_metadata.candidates_token_count or 0
                    total_token_usage["total_tokens"] += response.usage_metadata.total_token_count or 0

                # Check if there are function calls
                if not response.function_calls:
                    # No more tool calls, return the text response
                    return response.text or "", all_tool_results, total_token_usage

                # Process function calls
                function_call_parts = []
                function_response_parts = []

                for func_call in response.function_calls:
                    tool_name = func_call.name
                    arguments = dict(func_call.args) if func_call.args else {}

                    logger.info(f"Executing tool: {tool_name} with args: {arguments}")

                    # Execute the tool
                    result = await tool_executor.execute_tool(tool_name, arguments)

                    all_tool_results.append({
                        "tool": tool_name,
                        "arguments": arguments,
                        "result": result
                    })

                    # Build function response
                    function_response_parts.append(
                        types.Part.from_function_response(
                            name=tool_name,
                            response={"result": json.dumps(result)}
                        )
                    )

                # Add function call content from model
                current_contents.append(response.candidates[0].content)

                # Add function response content
                current_contents.append(
                    types.Content(
                        role="tool",
                        parts=function_response_parts
                    )
                )

            # If we reached max iterations, generate a final response
            response = self.client.models.generate_content(
                model=self.model,
                contents=current_contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.7,
                    max_output_tokens=2048
                )
            )

            # Accumulate final response token usage
            if response.usage_metadata:
                total_token_usage["prompt_tokens"] += response.usage_metadata.prompt_token_count or 0
                total_token_usage["completion_tokens"] += response.usage_metadata.candidates_token_count or 0
                total_token_usage["total_tokens"] += response.usage_metadata.total_token_count or 0

            return response.text or "", all_tool_results, total_token_usage

        finally:
            await tool_executor.close()

    def _add_product_image(self, product: Dict[str, Any]) -> Dict[str, Any]:
        """Add image_url to product using Picsum placeholder.

        Args:
            product: Product dictionary

        Returns:
            Product dictionary with image_url added
        """
        product_id = product.get("product_id")
        if product_id and "image_url" not in product:
            # Use Picsum with product_id as seed for consistent images
            product["image_url"] = f"https://picsum.photos/seed/{product_id}/200/200"
        return product

    def _extract_products_from_results(
        self,
        tool_results: List[Dict[str, Any]]
    ) -> Optional[List[Dict[str, Any]]]:
        """Extract product data from tool results for frontend rendering.

        Args:
            tool_results: List of tool execution results

        Returns:
            List of product dictionaries or None
        """
        products = []

        for result in tool_results:
            data = result.get("result", {}).get("data", {})

            # Handle search results
            if "items" in data:
                for item in data["items"]:
                    if "product_id" in item:
                        products.append(self._add_product_image(item))

            # Handle single product
            elif "product_id" in data:
                products.append(self._add_product_image(data))

            # Handle gift suggestions
            elif "suggestions" in data:
                for suggestion in data["suggestions"]:
                    products.append(self._add_product_image(suggestion))

            # Handle comparison results
            elif "products" in data:
                for product in data["products"]:
                    products.append(self._add_product_image(product))

        # Deduplicate by product_id and ensure all have image_url
        seen = set()
        unique_products = []
        for p in products:
            pid = p.get("product_id")
            if pid and pid not in seen:
                seen.add(pid)
                # Ensure image_url is added
                unique_products.append(self._add_product_image(p))

        return unique_products if unique_products else None

    async def get_session_history(
        self,
        session_id: str
    ) -> Dict[str, Any]:
        """Get full session history.

        Args:
            session_id: The chat session ID

        Returns:
            Session information with message history
        """
        session = await self.history_service.get_session(session_id)
        if not session:
            return {"error": "Session not found"}

        messages = await self.history_service.get_session_history(session_id)

        return {
            "session_id": session.chat_session_id,
            "customer_id": session.customer_id,
            "created_at": session.created_at,
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.chat_content,
                    "token_usage": msg.token_usage,
                    "created_at": msg.created_at
                }
                for msg in messages
            ]
        }
