import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class SessionStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class QuizSession(Base):
    __tablename__ = "quiz_sessions"
    __table_args__ = (
        Index("ix_quiz_sessions_user_id", "user_id"),
        Index("ix_quiz_sessions_status", "status"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(SessionStatus), default=SessionStatus.IN_PROGRESS, nullable=False)
    score = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))

    user = relationship("User", back_populates="sessions")
    items = relationship("QuizSessionItem", back_populates="session", cascade="all, delete-orphan")


class QuizSessionItem(Base):
    __tablename__ = "quiz_session_items"
    __table_args__ = (
        UniqueConstraint("session_id", "question_id", name="uq_session_question"),
        Index("ix_quiz_session_items_session_id", "session_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("quiz_sessions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False)
    user_answer = Column(Text)
    is_correct = Column(Boolean)
    answered_at = Column(DateTime(timezone=True))
    time_spent = Column(Integer)  # seconds

    session = relationship("QuizSession", back_populates="items")
    question = relationship("Question", back_populates="session_items")


class UserProgress(Base):
    __tablename__ = "user_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "topic_id", name="uq_user_topic_progress"),
        Index("ix_user_progress_user_id", "user_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(String(36), ForeignKey("topics.id"), nullable=False)
    best_score = Column(Integer, default=0)
    attempts = Column(Integer, default=0)
    last_attempt = Column(DateTime(timezone=True))

    user = relationship("User", back_populates="progress")
    topic = relationship("Topic", back_populates="progress")
