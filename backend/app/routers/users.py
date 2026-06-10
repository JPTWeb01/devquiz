from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.quiz_session import QuizSession, SessionStatus, UserProgress
from app.models.user import User
from app.schemas.user import UserStatsOut

router = APIRouter()


@router.get("/me/stats", response_model=UserStatsOut)
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quizzes_taken = (
        db.query(QuizSession)
        .filter(
            QuizSession.user_id == current_user.id,
            QuizSession.status == SessionStatus.COMPLETED,
        )
        .count()
    )

    progress_rows = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == current_user.id)
        .all()
    )

    best_score = max((p.best_score for p in progress_rows), default=0)
    topics_completed = len(progress_rows)

    return UserStatsOut(
        quizzes_taken=quizzes_taken,
        best_score=best_score,
        topics_completed=topics_completed,
    )
