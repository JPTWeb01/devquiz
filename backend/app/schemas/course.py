from typing import List, Optional

from pydantic import BaseModel, Field


class TopicOut(BaseModel):
    id: str
    title: str
    slug: str
    description: Optional[str]
    order: int
    is_published: bool = True

    model_config = {"from_attributes": True}


class CourseOut(BaseModel):
    id: str
    title: str
    slug: str
    description: Optional[str]
    language: str
    icon: Optional[str]
    order: int
    is_published: bool = True
    topics: List[TopicOut] = []

    model_config = {"from_attributes": True}


class CourseListOut(BaseModel):
    id: str
    title: str
    slug: str
    language: str
    icon: Optional[str]
    description: Optional[str]
    topic_count: int = 0
    is_published: bool = True


class CourseCreate(BaseModel):
    title: str = Field(..., min_length=2)
    slug: str = Field(..., min_length=2)
    description: Optional[str] = None
    language: str
    icon: Optional[str] = None
    order: int = 0
    is_published: bool = False


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    icon: Optional[str] = None
    order: Optional[int] = None
    is_published: Optional[bool] = None


class TopicCreate(BaseModel):
    title: str = Field(..., min_length=2)
    slug: str = Field(..., min_length=2)
    description: Optional[str] = None
    order: int = 0
    is_published: bool = False


class TopicUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    is_published: Optional[bool] = None
