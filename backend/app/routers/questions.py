import io
from datetime import date
from typing import List

import pdfplumber
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import require_admin, require_editor
from app.database import get_db
from app.models.ai_usage import AIUsageLog, UploadRecord
from app.models.question import Question
from app.models.user import User
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionWithAnswerOut
from app.services.ai_service import generate_questions

router = APIRouter()


def _check_ai_configured():
    if not settings.GROQ_API_KEY and not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI not configured. Add GROQ_API_KEY or GEMINI_API_KEY to .env"
        )


def _check_and_track_usage(db: Session, user_id: str) -> AIUsageLog | None:
    today = date.today()
    usage = (
        db.query(AIUsageLog)
        .filter(AIUsageLog.user_id == user_id, AIUsageLog.date == today)
        .first()
    )
    if usage and usage.count >= settings.AI_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Daily AI limit reached ({settings.AI_DAILY_LIMIT} calls/day)"
        )
    return usage


def _record_usage(db: Session, usage: AIUsageLog | None, user_id: str):
    if usage:
        usage.count += 1
    else:
        db.add(AIUsageLog(user_id=user_id, date=date.today(), count=1))


@router.get("", response_model=List[QuestionWithAnswerOut])
def list_questions(
    topic_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    return (
        db.query(Question)
        .filter(Question.topic_id == topic_id)
        .order_by(Question.created_at)
        .all()
    )


@router.post("", response_model=QuestionWithAnswerOut, status_code=201)
def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    question = Question(**data.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.put("/{question_id}", response_model=QuestionWithAnswerOut)
def update_question(
    question_id: str,
    data: QuestionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(question, field, value)
    db.commit()
    db.refresh(question)
    return question


@router.patch("/{question_id}/publish", response_model=QuestionWithAnswerOut)
def toggle_publish(
    question_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question.is_published = not question.is_published
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}", status_code=204)
def delete_question(
    question_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(question)
    db.commit()


class TextGenerateRequest(BaseModel):
    topic_id: str
    content: str = Field(..., min_length=30)
    count: int = Field(default=10, ge=1, le=20)


@router.post("/from-text")
def generate_from_text(
    data: TextGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    _check_ai_configured()
    usage = _check_and_track_usage(db, current_user.id)

    try:
        questions, provider = generate_questions(
            content=data.content,
            count=data.count,
            groq_api_key=settings.GROQ_API_KEY,
            gemini_api_key=settings.GEMINI_API_KEY,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    _record_usage(db, usage, current_user.id)
    db.commit()

    return {"questions": questions, "parsed_count": len(questions), "provider": provider}


@router.post("/from-pdf")
async def generate_from_pdf(
    file: UploadFile = File(...),
    topic_id: str = Form(...),
    count: int = Form(default=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_editor),
):
    _check_ai_configured()
    usage = _check_and_track_usage(db, current_user.id)

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    contents = await file.read()
    try:
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            page_count = len(pdf.pages)
            text = "\n\n".join(page.extract_text() or "" for page in pdf.pages).strip()
    except Exception:
        raise HTTPException(status_code=400, detail="Could not parse PDF")

    if not text:
        raise HTTPException(status_code=400, detail="PDF has no extractable text")

    try:
        questions, provider = generate_questions(
            content=text,
            count=count,
            groq_api_key=settings.GROQ_API_KEY,
            gemini_api_key=settings.GEMINI_API_KEY,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    _record_usage(db, usage, current_user.id)
    db.add(UploadRecord(
        filename=file.filename,
        file_type="pdf",
        page_count=page_count,
        parsed_count=len(questions),
        uploaded_by=current_user.id,
    ))
    db.commit()

    return {"questions": questions, "parsed_count": len(questions), "filename": file.filename, "provider": provider}
