"""Chat session and chat details models for AI chatbot history."""
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class ChatSession(Base):
    """Chat session model for storing conversation sessions."""
    __tablename__ = "chat_session"
    __table_args__ = {"schema": "aichatbot"}

    chat_session_id = Column(String(60), primary_key=True)
    # customer_id is obtained from bearer token, no ORM-level FK needed
    # Database-level FK constraint can still exist
    customer_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    messages = relationship("ChatDetails", back_populates="session", lazy="selectin")


class ChatDetails(Base):
    """Chat details model for storing individual messages."""
    __tablename__ = "chat_details"
    __table_args__ = {"schema": "aichatbot"}

    chat_id_sequence = Column(Integer, primary_key=True, autoincrement=True)
    chat_session_id = Column(
        String(60),
        ForeignKey("aichatbot.chat_session.chat_session_id"),
        nullable=True
    )
    role = Column(String(20))  # 'user' or 'model'
    chat_content = Column(Text)
    token_usage = Column(JSONB, nullable=True)  # Stores token usage for model responses
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")
