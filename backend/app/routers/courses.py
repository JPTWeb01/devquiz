from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.deps import require_admin
from app.database import get_db
from app.models.course import Course
from app.models.topic import Topic
from app.models.user import User
from app.schemas.course import CourseListOut, CourseOut

router = APIRouter()


@router.get("", response_model=List[CourseListOut])
def list_courses(db: Session = Depends(get_db)):
    courses = (
        db.query(Course)
        .filter(Course.is_published == True)
        .order_by(Course.order)
        .all()
    )
    result = []
    for c in courses:
        topic_count = (
            db.query(Topic)
            .filter(Topic.course_id == c.id, Topic.is_published == True)
            .count()
        )
        result.append(
            CourseListOut(
                id=c.id,
                title=c.title,
                slug=c.slug,
                language=c.language,
                icon=c.icon,
                description=c.description,
                topic_count=topic_count,
            )
        )
    return result


@router.get("/{slug}", response_model=CourseOut)
def get_course(slug: str, db: Session = Depends(get_db)):
    course = (
        db.query(Course)
        .options(joinedload(Course.topics))
        .filter(Course.slug == slug, Course.is_published == True)
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course
