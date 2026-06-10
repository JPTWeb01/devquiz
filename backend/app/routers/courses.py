from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_admin, require_editor
from app.database import get_db
from app.models.course import Course
from app.models.topic import Topic
from app.models.user import User
from app.schemas.course import (
    CourseCreate,
    CourseListOut,
    CourseOut,
    CourseUpdate,
    TopicCreate,
    TopicOut,
    TopicUpdate,
)

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
                is_published=c.is_published,
            )
        )
    return result


@router.get("/admin/all", response_model=List[CourseListOut])
def admin_list_courses(
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    courses = db.query(Course).order_by(Course.order).all()
    result = []
    for c in courses:
        topic_count = db.query(Topic).filter(Topic.course_id == c.id).count()
        result.append(
            CourseListOut(
                id=c.id,
                title=c.title,
                slug=c.slug,
                language=c.language,
                icon=c.icon,
                description=c.description,
                topic_count=topic_count,
                is_published=c.is_published,
            )
        )
    return result


@router.post("", response_model=CourseOut, status_code=201)
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    if db.query(Course).filter(Course.slug == data.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    course = Course(**data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.put("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: str,
    data: CourseUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=204)
def delete_course(
    course_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()


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


@router.get("/{course_id}/topics/admin", response_model=List[TopicOut])
def admin_list_topics(
    course_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    return db.query(Topic).filter(Topic.course_id == course_id).order_by(Topic.order).all()


@router.post("/{course_id}/topics", response_model=TopicOut, status_code=201)
def create_topic(
    course_id: str,
    data: TopicCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    topic = Topic(course_id=course_id, **data.model_dump())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.put("/topics/{topic_id}", response_model=TopicOut)
def update_topic(
    topic_id: str,
    data: TopicUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(topic, field, value)
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/topics/{topic_id}", status_code=204)
def delete_topic(
    topic_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    db.delete(topic)
    db.commit()
