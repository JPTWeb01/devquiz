from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.core.security import hash_password
from app.database import get_db
from app.models.course import Course
from app.models.question import Question
from app.models.quiz_session import QuizSession, SessionStatus
from app.models.topic import Topic
from app.models.user import Role, User
from app.schemas.user import UserOut

router = APIRouter()


class AdminStatsOut(BaseModel):
    total_courses: int
    total_topics: int
    total_questions: int
    published_questions: int
    total_users: int
    total_sessions: int


class UserAdminOut(BaseModel):
    id: str
    email: str
    name: Optional[str]
    role: Role
    is_active: bool
    is_master: bool = False
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class UserCreateAdmin(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: Role = Role.STUDENT


class UserUpdateAdmin(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


@router.get("/stats", response_model=AdminStatsOut)
def get_admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return AdminStatsOut(
        total_courses=db.query(Course).count(),
        total_topics=db.query(Topic).count(),
        total_questions=db.query(Question).count(),
        published_questions=db.query(Question).filter(Question.is_published == True).count(),
        total_users=db.query(User).count(),
        total_sessions=db.query(QuizSession).filter(QuizSession.status == SessionStatus.COMPLETED).count(),
    )


@router.get("/users", response_model=List[UserAdminOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("/users", response_model=UserAdminOut, status_code=201)
def create_user(
    data: UserCreateAdmin,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserAdminOut)
def update_user(
    user_id: str,
    data: UserUpdateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_master and not current_user.is_master:
        raise HTTPException(status_code=403, detail="Only the master admin can edit this account")
    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        existing = db.query(User).filter(User.email == data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email
    if data.role is not None:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.password:
        user.password_hash = hash_password(data.password)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_master:
        raise HTTPException(status_code=403, detail="Master admin account cannot be deleted")
    db.delete(user)
    db.commit()
