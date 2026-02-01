"""Pydantic schemas for chatbot API."""
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class ChatMessageRequest(BaseModel):
    """Request schema for sending a chat message."""
    message: str = Field(..., min_length=1, description="User message to the chatbot")
    session_id: Optional[str] = Field(None, description="Existing session ID to continue conversation")


class TokenUsage(BaseModel):
    """Schema for token usage statistics."""
    prompt_tokens: int = Field(..., description="Number of tokens in the prompt")
    completion_tokens: int = Field(..., description="Number of tokens in the completion")
    total_tokens: int = Field(..., description="Total tokens used")


class ChatMessageResponse(BaseModel):
    """Response schema for chat message."""
    session_id: str
    response: str
    tool_calls: Optional[List[dict]] = None
    products: Optional[List[dict]] = None
    token_usage: TokenUsage
    created_at: datetime


class ChatHistoryItem(BaseModel):
    """Schema for a single chat history item."""
    role: str
    content: str
    token_usage: Optional[TokenUsage] = None
    created_at: datetime


class ChatSessionResponse(BaseModel):
    """Response schema for chat session with history."""
    session_id: str
    customer_id: Optional[int]
    messages: List[ChatHistoryItem]
    created_at: datetime


class ProductSearchResult(BaseModel):
    """Schema for product search results returned by chatbot."""
    product_id: int
    product_name: str
    product_brand: str
    retail_price: float
    department: str
    category_name: Optional[str] = None
    stock_status: Optional[str] = None


class CartItemResult(BaseModel):
    """Schema for cart item in chatbot response."""
    order_item_id: str
    product_id: int
    product_name: str
    retail_price: float


class CartSummary(BaseModel):
    """Schema for cart summary in chatbot response."""
    total_items: int
    total_price: float
    items: List[CartItemResult]
    voucher_applied: Optional[str] = None
    discount_amount: Optional[float] = None


class ToolCallResult(BaseModel):
    """Schema for tool call results."""
    tool_name: str
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
