from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field

from app.models.quiz_session import SessionStatus
from app.schemas.question import QuestionOut


class QuizStartRequest(BaseModel):
    topic_id: str
    question_count: int = Field(default=10, ge=5, le=30)


class QuizStartOut(BaseModel):
    session_id: str
    questions: List[QuestionOut]
    total_questions: int


class AnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer: str = Field(..., min_length=1)
    time_spent: Optional[int] = None


class AnswerOut(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: str
    points_earned: int


class SessionItemOut(BaseModel):
    question_id: str
    user_answer: Optional[str]
    is_correct: Optional[bool]
    time_spent: Optional[int]


class QuizResultOut(BaseModel):
    session_id: str
    score: int
    total_points: int
    percentage: float
    status: SessionStatus
    completed_at: Optional[datetime]
    items: List[SessionItemOut]
