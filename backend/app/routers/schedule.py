from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database import get_db
from app.models.course import Course
from app.models.schedule import WeeklySchedule
from app.models.topic import Topic
from app.models.user import User

router = APIRouter()

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class ScheduleOut(BaseModel):
    id: str
    day_of_week: int
    day_name: str
    topic_id: str
    topic_title: str
    course_title: str
    question_count: int
    is_active: bool
    last_run_at: Optional[datetime]


class ScheduleCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    topic_id: str
    question_count: int = Field(default=5, ge=1, le=20)


class ScheduleUpdate(BaseModel):
    question_count: Optional[int] = Field(default=None, ge=1, le=20)
    is_active: Optional[bool] = None


class TopicOption(BaseModel):
    id: str
    title: str
    course_title: str


def _to_out(entry: WeeklySchedule, db: Session) -> ScheduleOut:
    topic = db.query(Topic).filter(Topic.id == entry.topic_id).first()
    course = db.query(Course).filter(Course.id == topic.course_id).first() if topic else None
    return ScheduleOut(
        id=entry.id,
        day_of_week=entry.day_of_week,
        day_name=DAYS[entry.day_of_week],
        topic_id=entry.topic_id,
        topic_title=topic.title if topic else "Unknown",
        course_title=course.title if course else "Unknown",
        question_count=entry.question_count,
        is_active=entry.is_active,
        last_run_at=entry.last_run_at,
    )


@router.get("", response_model=List[ScheduleOut])
def list_schedules(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    entries = db.query(WeeklySchedule).order_by(WeeklySchedule.day_of_week).all()
    return [_to_out(e, db) for e in entries]


@router.get("/topics", response_model=List[TopicOption])
def list_topics_for_schedule(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    topics = db.query(Topic).filter(Topic.is_published == True).order_by(Topic.title).all()
    result = []
    for t in topics:
        course = db.query(Course).filter(Course.id == t.course_id).first()
        result.append(TopicOption(
            id=t.id,
            title=t.title,
            course_title=course.title if course else "Unknown",
        ))
    return result


@router.post("", response_model=ScheduleOut, status_code=201)
def create_schedule(data: ScheduleCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    topic = db.query(Topic).filter(Topic.id == data.topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    existing = db.query(WeeklySchedule).filter(
        WeeklySchedule.day_of_week == data.day_of_week,
        WeeklySchedule.topic_id == data.topic_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This topic is already scheduled for that day")
    entry = WeeklySchedule(
        day_of_week=data.day_of_week,
        topic_id=data.topic_id,
        question_count=data.question_count,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _to_out(entry, db)


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(
    schedule_id: str,
    data: ScheduleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    entry = db.query(WeeklySchedule).filter(WeeklySchedule.id == schedule_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if data.question_count is not None:
        entry.question_count = data.question_count
    if data.is_active is not None:
        entry.is_active = data.is_active
    db.commit()
    db.refresh(entry)
    return _to_out(entry, db)


@router.delete("/{schedule_id}", status_code=204)
def delete_schedule(schedule_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    entry = db.query(WeeklySchedule).filter(WeeklySchedule.id == schedule_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(entry)
    db.commit()


@router.post("/trigger", status_code=200)
def trigger_now(_: User = Depends(require_admin)):
    """Manually run today's scheduled generation immediately."""
    from app.services.scheduler import trigger_now
    trigger_now()
    return {"message": "Today's schedule triggered successfully"}
