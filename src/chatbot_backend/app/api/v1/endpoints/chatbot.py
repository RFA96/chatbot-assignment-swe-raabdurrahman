"""Chatbot API endpoints."""
import logging
from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.database import get_db
from app.schemas.chat import ChatMessageRequest
from app.chatbot.service import ChatbotService
from app.core.security import decode_token
from app.utils.response_utils import success_response
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Use same scheme_name as CustomerAuth so it shares the Swagger authorize button
# but with auto_error=False so authentication is optional
optional_customer_security = HTTPBearer(
    scheme_name="CustomerAuth",
    description="JWT token for customer authentication (optional for chatbot)",
    auto_error=False
)


def get_api_base_url() -> str:
    """Get the e-commerce API base URL."""
    return f"http://{settings.HOST}:{settings.PORT}/api/v1"


def get_optional_customer_id(
    credentials: Optional[HTTPAuthorizationCredentials]
) -> tuple[Optional[int], Optional[str]]:
    """Extract customer_id and token from optional credentials by decoding JWT.

    Returns:
        Tuple of (customer_id, auth_token) - both may be None if not authenticated
    """
    if not credentials:
        logger.info("No credentials provided - continuing as guest")
        return None, None

    token = credentials.credentials
    logger.info(f"Decoding token: {token[:30]}...")

    # Decode JWT token directly
    payload = decode_token(token)
    if not payload:
        logger.warning("Token decode failed - invalid or expired token")
        return None, None

    # Extract customer_id from 'sub' field
    customer_id_str = payload.get("sub")
    user_type = payload.get("type")

    if not customer_id_str or user_type != "customer":
        logger.warning(f"Invalid token payload - sub: {customer_id_str}, type: {user_type}")
        return None, None

    try:
        customer_id = int(customer_id_str)
        logger.info(f"Token decoded successfully - customer_id: {customer_id}")
        return customer_id, token
    except ValueError:
        logger.warning(f"Invalid customer_id in token: {customer_id_str}")
        return None, None


@router.post("/chat", response_model=None)
async def send_message(
    request: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_customer_security)
):
    """Send a message to the chatbot and receive a response.

    This endpoint handles the complete conversation flow:
    1. Creates or continues a chat session
    2. Processes the user message through Google GenAI
    3. Executes any tool calls to interact with e-commerce APIs
    4. Returns the AI-generated response with optional product data

    Args:
        request: Chat message request containing user message and optional session_id
        db: Database session
        credentials: Optional Bearer token for authenticated operations

    Returns:
        Chat response with AI message, session ID, and any product data
    """
    # Extract customer_id and token from Bearer token
    customer_id, auth_token = get_optional_customer_id(credentials)

    # Initialize chatbot service
    chatbot = ChatbotService(
        db=db,
        api_base_url=get_api_base_url(),
        auth_token=auth_token,
        customer_id=customer_id
    )

    # Process the message
    result = await chatbot.chat(
        message=request.message,
        session_id=request.session_id
    )

    return success_response(
        message="Message processed successfully",
        data={
            "session_id": result["session_id"],
            "response": result["response"],
            "tool_calls": result.get("tool_calls"),
            "products": result.get("products"),
            "token_usage": result.get("token_usage"),
            "created_at": result["created_at"].isoformat()
        }
    )


@router.get("/chat/sessions/{session_id}", response_model=None)
async def get_session_history(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_customer_security)
):
    """Get chat history for a specific session.

    Args:
        session_id: The chat session ID
        db: Database session
        credentials: Optional Bearer token

    Returns:
        Session information with full message history
    """
    _, auth_token = get_optional_customer_id(credentials)

    chatbot = ChatbotService(
        db=db,
        api_base_url=get_api_base_url(),
        auth_token=auth_token
    )

    result = await chatbot.get_session_history(session_id)

    if "error" in result:
        return success_response(
            message=result["error"],
            status_code=404
        )

    return success_response(
        message="Session history retrieved successfully",
        data=result
    )


@router.get("/chat/sessions", response_model=None)
async def get_customer_sessions(
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_customer_security),
    limit: int = 10
):
    """Get all chat sessions for the authenticated customer.

    Requires authentication via Bearer token. Returns a list of chat sessions
    belonging to the authenticated customer.

    Args:
        db: Database session
        credentials: Bearer token for authentication (required)
        limit: Maximum number of sessions to return (default: 10)

    Returns:
        List of customer's chat sessions
    """
    from app.services.chat_history_service import ChatHistoryService

    # Extract customer_id from token - required for this endpoint
    customer_id, _ = get_optional_customer_id(credentials)

    if not customer_id:
        return success_response(
            message="Authentication required to view chat sessions",
            status_code=401
        )

    logger.info(f"get_customer_sessions - customer_id: {customer_id}, limit: {limit}")

    history_service = ChatHistoryService(db)
    sessions = await history_service.get_customer_sessions(
        customer_id=customer_id,
        limit=limit
    )

    return success_response(
        message="Chat sessions retrieved successfully",
        data={
            "sessions": [
                {
                    "session_id": session.chat_session_id,
                    "customer_id": session.customer_id,
                    "created_at": session.created_at.isoformat()
                }
                for session in sessions
            ],
            "total": len(sessions)
        }
    )


@router.post("/chat/sessions", response_model=None)
async def create_new_session(
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_customer_security)
):
    """Create a new chat session.

    Customer ID is automatically extracted from the Bearer token if provided.

    Args:
        db: Database session
        credentials: Optional Bearer token for authentication

    Returns:
        New session information
    """
    from app.services.chat_history_service import ChatHistoryService

    # Extract customer_id from token if authenticated
    customer_id, _ = get_optional_customer_id(credentials)
    logger.info(f"create_new_session - customer_id: {customer_id}")

    history_service = ChatHistoryService(db)
    session = await history_service.create_session(customer_id=customer_id)

    return success_response(
        message="Chat session created successfully",
        status_code=201,
        data={
            "session_id": session.chat_session_id,
            "customer_id": session.customer_id,
            "created_at": session.created_at.isoformat()
        }
    )


@router.delete("/chat/sessions/{session_id}", response_model=None)
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_customer_security)
):
    """Delete a chat session and all its messages.

    Deletes a chat session by its ID. If authenticated, only allows deletion
    of sessions belonging to the authenticated customer. Guest sessions can
    be deleted without authentication.

    Args:
        session_id: The chat session ID to delete
        db: Database session
        credentials: Optional Bearer token for authentication

    Returns:
        Success message if deleted, 404 if session not found
    """
    from app.services.chat_history_service import ChatHistoryService

    # Extract customer_id from token if authenticated
    customer_id, _ = get_optional_customer_id(credentials)
    logger.info(f"delete_session - session_id: {session_id}, customer_id: {customer_id}")

    history_service = ChatHistoryService(db)

    # Check if session exists and verify ownership if authenticated
    session = await history_service.get_session(session_id)
    if not session:
        return success_response(
            message="Chat session not found",
            status_code=404
        )

    # If authenticated, only allow deletion of own sessions
    if customer_id and session.customer_id and session.customer_id != customer_id:
        return success_response(
            message="You are not authorized to delete this session",
            status_code=403
        )

    # Delete the session
    deleted = await history_service.delete_session(session_id)

    if deleted:
        return success_response(
            message="Chat session deleted successfully",
            data={
                "session_id": session_id
            }
        )
    else:
        return success_response(
            message="Chat session not found",
            status_code=404
        )
