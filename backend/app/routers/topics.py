from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.question import Question
from app.models.topic import Topic

router = APIRouter()


@router.get("/{topic_id}/questions/count")
def get_question_count(topic_id: str, db: Session = Depends(get_db)):
    topic = (
        db.query(Topic)
        .filter(Topic.id == topic_id, Topic.is_published == True)
        .first()
    )
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    count = (
        db.query(Question)
        .filter(Question.topic_id == topic_id, Question.is_published == True)
        .count()
    )
    return {"topic_id": topic_id, "question_count": count}
