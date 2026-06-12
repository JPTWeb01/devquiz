from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field

from app.models.question import Difficulty, QuestionType


class QuestionCreate(BaseModel):
    topic_id: str
    type: QuestionType
    difficulty: Difficulty
    question_text: str = Field(..., min_length=1)
    code_block: Optional[str] = None
    options: Optional[List[dict]] = None
    correct_answer: str
    explanation: str
    tags: Optional[str] = None
    points: int = Field(default=10, ge=1, le=100)
    is_published: bool = True


class QuestionOut(BaseModel):
    id: str
    type: QuestionType
    difficulty: Difficulty
    question_text: str
    code_block: Optional[str]
    options: Optional[List[Any]]
    points: int

    model_config = {"from_attributes": True}


class QuestionWithAnswerOut(QuestionOut):
    topic_id: str
    correct_answer: str
    explanation: str
    tags: Optional[str]
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AdminQuestionAllOut(BaseModel):
    id: str
    type: QuestionType
    difficulty: Difficulty
    question_text: str
    code_block: Optional[str]
    options: Optional[List[Any]]
    correct_answer: str
    explanation: str
    tags: Optional[str]
    points: int
    is_published: bool
    published_at: Optional[datetime]
    created_at: Optional[datetime]
    topic_id: str
    topic_title: str
    course_title: str

    model_config = {"from_attributes": False}


class QuestionUpdate(BaseModel):
    type: Optional[QuestionType] = None
    difficulty: Optional[Difficulty] = None
    question_text: Optional[str] = None
    code_block: Optional[str] = None
    options: Optional[List[dict]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    tags: Optional[str] = None
    points: Optional[int] = Field(default=None, ge=1, le=100)
    is_published: Optional[bool] = None
