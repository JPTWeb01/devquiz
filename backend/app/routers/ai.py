from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.services.ai_service import chat_with_tutor

router = APIRouter()


class TutorRequest(BaseModel):
    question_text: str
    question_type: str
    correct_answer: str
    user_answer: str
    explanation: str
    is_correct: bool
    code_block: str | None = None
    history: list[dict] = []
    message: str | None = None


@router.post("/tutor")
def get_tutor_explanation(req: TutorRequest):
    if not settings.GROQ_API_KEY and not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI tutor is not configured")
    try:
        text = chat_with_tutor(
            question_text=req.question_text,
            question_type=req.question_type,
            correct_answer=req.correct_answer,
            user_answer=req.user_answer,
            explanation=req.explanation,
            is_correct=req.is_correct,
            history=req.history,
            message=req.message,
            code_block=req.code_block,
            groq_api_key=settings.GROQ_API_KEY,
            gemini_api_key=settings.GEMINI_API_KEY,
        )
        return {"explanation": text}
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
