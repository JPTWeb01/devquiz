import copy
import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.quiz_session import (
    QuizSession,
    QuizSessionItem,
    SessionStatus,
    UserProgress,
)
from app.models.user import User
from app.schemas.question import QuestionOut
from app.schemas.quiz import (
    AnswerOut,
    AnswerRequest,
    QuizResultOut,
    QuizStartOut,
    QuizStartRequest,
    SessionItemOut,
)
from app.services.quiz_engine import select_questions

router = APIRouter()


def _shuffle_mcq_options(options: list) -> list:
    """Return a deep-copied, shuffled options list with labels reassigned A–D."""
    shuffled = copy.deepcopy(options)
    random.shuffle(shuffled)
    for i, opt in enumerate(shuffled):
        opt["label"] = ["A", "B", "C", "D"][i] if i < 4 else opt["label"]
    return shuffled


@router.post("/start", response_model=QuizStartOut)
def start_quiz(
    data: QuizStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(QuizSession)
        .filter(
            QuizSession.user_id == current_user.id,
            QuizSession.topic_id == data.topic_id,
            QuizSession.status == SessionStatus.IN_PROGRESS,
        )
        .first()
    )
    if existing:
        existing.status = SessionStatus.ABANDONED
        db.commit()

    questions = select_questions(
        db, data.topic_id, data.question_count,
        difficulty=data.difficulty,
        question_type=data.question_type,
    )
    if not questions:
        raise HTTPException(status_code=404, detail="No questions available for this topic")

    session = QuizSession(
        user_id=current_user.id,
        topic_id=data.topic_id,
        total_points=sum(q.points for q in questions),
    )
    db.add(session)
    db.flush()

    for q in questions:
        db.add(QuizSessionItem(session_id=session.id, question_id=q.id))

    db.commit()
    db.refresh(session)

    question_outs = []
    for q in questions:
        q_out = QuestionOut.model_validate(q)
        if q.type.value == "mcq" and q.options:
            q_out = q_out.model_copy(update={"options": _shuffle_mcq_options(q.options)})
        question_outs.append(q_out)

    return QuizStartOut(
        session_id=session.id,
        questions=question_outs,
        total_questions=len(questions),
    )


@router.post("/answer", response_model=AnswerOut)
def submit_answer(
    data: AnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(QuizSession)
        .filter(
            QuizSession.id == data.session_id,
            QuizSession.user_id == current_user.id,
            QuizSession.status == SessionStatus.IN_PROGRESS,
        )
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or already completed")

    item = (
        db.query(QuizSessionItem)
        .filter(
            QuizSessionItem.session_id == data.session_id,
            QuizSessionItem.question_id == data.question_id,
            QuizSessionItem.answered_at == None,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Question not found in session or already answered")

    question = item.question
    if question.type.value == "mcq" and question.options:
        # Answer is the option text; compare against correct option's text
        correct_text = next(
            (opt.get("text", "") for opt in question.options
             if opt.get("label") == question.correct_answer),
            question.correct_answer,
        )
        is_correct = data.answer.strip().lower() == correct_text.strip().lower()
        display_correct = correct_text
    elif question.type.value == "fill_blank":
        is_correct = data.answer.strip().lower() == question.correct_answer.strip().lower()
        display_correct = question.correct_answer
    else:
        is_correct = data.answer.strip() == question.correct_answer.strip()
        display_correct = question.correct_answer

    item.user_answer = data.answer
    item.is_correct = is_correct
    item.answered_at = datetime.now(timezone.utc)
    item.time_spent = data.time_spent

    if is_correct:
        session.score += question.points

    db.flush()  # write in-memory changes so the count query sees them

    unanswered = (
        db.query(QuizSessionItem)
        .filter(
            QuizSessionItem.session_id == session.id,
            QuizSessionItem.answered_at == None,
        )
        .count()
    )
    if unanswered == 0:
        session.status = SessionStatus.COMPLETED
        session.completed_at = datetime.now(timezone.utc)
        if current_user.email != "guest@devquiz.local":
            _update_progress(db, current_user.id, session.topic_id, session.score)

    db.commit()

    return AnswerOut(
        is_correct=is_correct,
        correct_answer=display_correct,
        explanation=question.explanation,
        points_earned=question.points if is_correct else 0,
    )


@router.get("/results/{session_id}", response_model=QuizResultOut)
def get_results(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(QuizSession)
        .filter(QuizSession.id == session_id, QuizSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    items = (
        db.query(QuizSessionItem)
        .filter(QuizSessionItem.session_id == session_id)
        .all()
    )
    percentage = (session.score / session.total_points * 100) if session.total_points > 0 else 0

    time_taken = None
    if session.started_at and session.completed_at:
        start = session.started_at.replace(tzinfo=None) if session.started_at.tzinfo else session.started_at
        end = session.completed_at.replace(tzinfo=None) if session.completed_at.tzinfo else session.completed_at
        time_taken = max(0, int((end - start).total_seconds()))

    return QuizResultOut(
        session_id=session.id,
        score=session.score,
        total_points=session.total_points,
        percentage=round(percentage, 1),
        status=session.status,
        completed_at=session.completed_at,
        started_at=session.started_at,
        time_taken_seconds=time_taken,
        items=[
            SessionItemOut(
                question_id=item.question_id,
                user_answer=item.user_answer,
                is_correct=item.is_correct,
                time_spent=item.time_spent,
                question_text=item.question.question_text if item.question else "",
                question_type=item.question.type.value if item.question else "",
                difficulty=item.question.difficulty.value if item.question else "",
                correct_answer=item.question.correct_answer if item.question else "",
                explanation=item.question.explanation if item.question else "",
                points=item.question.points if item.question else 0,
            )
            for item in items
        ],
    )


def _update_progress(db: Session, user_id: str, topic_id: str, score: int):
    progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id, UserProgress.topic_id == topic_id)
        .first()
    )
    if progress:
        progress.attempts += 1
        progress.best_score = max(progress.best_score, score)
        progress.last_attempt = datetime.now(timezone.utc)
    else:
        db.add(
            UserProgress(
                user_id=user_id,
                topic_id=topic_id,
                best_score=score,
                attempts=1,
                last_attempt=datetime.now(timezone.utc),
            )
        )
