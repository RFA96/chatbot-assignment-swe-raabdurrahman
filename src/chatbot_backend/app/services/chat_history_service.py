"""Service for managing chat history in the database."""
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ChatSession, ChatDetails


def generate_chat_session_id() -> str:
    """Generate a unique chat session ID.

    Format: chatsession_yyyymmdd_md5hash
    """
    date_str = datetime.utcnow().strftime("%Y%m%d")
    timestamp = datetime.utcnow().isoformat()
    hash_input = f"{timestamp}_{id(timestamp)}"
    md5_hash = hashlib.md5(hash_input.encode()).hexdigest()[:12]
    return f"chatsession_{date_str}_{md5_hash}"


class ChatHistoryService:
    """Service for managing chat sessions and messages."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_session(
        self,
        customer_id: Optional[int] = None
    ) -> ChatSession:
        """Create a new chat session.

        Args:
            customer_id: Optional customer ID if user is authenticated

        Returns:
            Created ChatSession object
        """
        session_id = generate_chat_session_id()
        session = ChatSession(
            chat_session_id=session_id,
            customer_id=customer_id,
            created_at=datetime.utcnow()
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Get a chat session by ID.

        Args:
            session_id: The chat session ID

        Returns:
            ChatSession object or None if not found
        """
        result = await self.db.execute(
            select(ChatSession).where(ChatSession.chat_session_id == session_id)
        )
        return result.scalar_one_or_none()

    async def get_or_create_session(
        self,
        session_id: Optional[str] = None,
        customer_id: Optional[int] = None
    ) -> ChatSession:
        """Get an existing session or create a new one.

        Args:
            session_id: Optional existing session ID
            customer_id: Optional customer ID

        Returns:
            ChatSession object
        """
        if session_id:
            session = await self.get_session(session_id)
            if session:
                return session
        return await self.create_session(customer_id)

    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        token_usage: Optional[Dict[str, Any]] = None
    ) -> ChatDetails:
        """Add a message to a chat session.

        Args:
            session_id: The chat session ID
            role: Message role ('user' or 'model')
            content: Message content
            token_usage: Optional token usage stats for model responses

        Returns:
            Created ChatDetails object
        """
        message = ChatDetails(
            chat_session_id=session_id,
            role=role,
            chat_content=content,
            token_usage=token_usage,
            created_at=datetime.utcnow()
        )
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return message

    async def get_session_history(
        self,
        session_id: str,
        limit: Optional[int] = None
    ) -> List[ChatDetails]:
        """Get chat history for a session.

        Args:
            session_id: The chat session ID
            limit: Optional limit on number of messages to retrieve

        Returns:
            List of ChatDetails objects ordered by creation time
        """
        query = (
            select(ChatDetails)
            .where(ChatDetails.chat_session_id == session_id)
            .order_by(ChatDetails.created_at.asc())
        )
        if limit:
            query = query.limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_recent_context(
        self,
        session_id: str,
        num_messages: int = 10
    ) -> List[dict]:
        """Get recent messages formatted for AI context.

        Args:
            session_id: The chat session ID
            num_messages: Number of recent messages to retrieve

        Returns:
            List of message dictionaries with role and content
        """
        messages = await self.get_session_history(session_id)
        recent = messages[-num_messages:] if len(messages) > num_messages else messages
        return [
            {"role": msg.role, "content": msg.chat_content}
            for msg in recent
        ]

    async def get_customer_sessions(
        self,
        customer_id: int,
        limit: int = 10
    ) -> List[ChatSession]:
        """Get chat sessions for a customer.

        Args:
            customer_id: The customer ID
            limit: Maximum number of sessions to return

        Returns:
            List of ChatSession objects
        """
        result = await self.db.execute(
            select(ChatSession)
            .where(ChatSession.customer_id == customer_id)
            .order_by(ChatSession.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def delete_session(self, session_id: str) -> bool:
        """Delete a chat session and all its messages.

        Args:
            session_id: The chat session ID to delete

        Returns:
            True if session was deleted, False if session not found
        """
        # First check if session exists
        session = await self.get_session(session_id)
        if not session:
            return False

        # Delete all messages in the session first (due to foreign key constraint)
        await self.db.execute(
            delete(ChatDetails).where(ChatDetails.chat_session_id == session_id)
        )

        # Delete the session
        await self.db.execute(
            delete(ChatSession).where(ChatSession.chat_session_id == session_id)
        )

        await self.db.commit()
        return True
