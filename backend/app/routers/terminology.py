from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional

from app.core.deps import require_editor
from app.database import get_db
from app.models.terminology import Terminology
from app.models.topic import Topic
from app.models.user import User

router = APIRouter()


class TerminologyOut(BaseModel):
    id: str
    topic_id: str
    term: str
    meaning: str
    order: int

    model_config = {"from_attributes": True}


class TerminologyCreate(BaseModel):
    term: str = Field(..., min_length=1)
    meaning: str = Field(..., min_length=1)
    order: int = 0


class TerminologyUpdate(BaseModel):
    term: Optional[str] = None
    meaning: Optional[str] = None
    order: Optional[int] = None


@router.get("/topics/{topic_id}/terminology", response_model=List[TerminologyOut])
def list_terminology(
    topic_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return db.query(Terminology).filter(Terminology.topic_id == topic_id).order_by(Terminology.order).all()


@router.post("/topics/{topic_id}/terminology", response_model=TerminologyOut, status_code=201)
def create_term(
    topic_id: str,
    data: TerminologyCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    term = Terminology(topic_id=topic_id, **data.model_dump())
    db.add(term)
    db.commit()
    db.refresh(term)
    return term


@router.put("/terminology/{term_id}", response_model=TerminologyOut)
def update_term(
    term_id: str,
    data: TerminologyUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    term = db.query(Terminology).filter(Terminology.id == term_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(term, field, value)
    db.commit()
    db.refresh(term)
    return term


@router.delete("/terminology/{term_id}", status_code=204)
def delete_term(
    term_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor),
):
    term = db.query(Terminology).filter(Terminology.id == term_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    db.delete(term)
    db.commit()
