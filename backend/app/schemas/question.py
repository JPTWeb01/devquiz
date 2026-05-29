from typing import Any, List, Optional

from pydantic import BaseModel, Field

from app.models.question import Difficulty, QuestionType


class QuestionCreate(BaseModel):
    topic_id: str
    type: QuestionType
    difficulty: Difficulty
    question_text: str = Field(..., min_length=10)
    code_block: Optional[str] = None
    options: Optional[List[dict]] = None
    correct_answer: str
    explanation: str
    tags: Optional[str] = None
    points: int = Field(default=10, ge=1, le=100)


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
    correct_answer: str
    explanation: str
