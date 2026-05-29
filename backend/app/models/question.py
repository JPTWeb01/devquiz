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
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class QuestionType(str, enum.Enum):
    MCQ = "mcq"
    PREDICT_OUTPUT = "predict_output"
    DEBUGGING = "debugging"
    FILL_BLANK = "fill_blank"
    CODE_WRITING = "code_writing"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Question(Base):
    __tablename__ = "questions"
    __table_args__ = (
        Index("ix_questions_topic_id", "topic_id"),
        Index("ix_questions_difficulty", "difficulty"),
        Index("ix_questions_type", "type"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(QuestionType), nullable=False)
    difficulty = Column(Enum(Difficulty), nullable=False)
    question_text = Column(Text, nullable=False)
    code_block = Column(Text)
    options = Column(JSON)  # MCQ: [{"label": "A", "text": "..."}]
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    tags = Column(String(500))
    points = Column(Integer, default=10)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    topic = relationship("Topic", back_populates="questions")
    session_items = relationship("QuizSessionItem", back_populates="question")
