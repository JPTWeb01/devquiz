from typing import List, Optional

from pydantic import BaseModel


class TopicOut(BaseModel):
    id: str
    title: str
    slug: str
    description: Optional[str]
    order: int

    model_config = {"from_attributes": True}


class CourseOut(BaseModel):
    id: str
    title: str
    slug: str
    description: Optional[str]
    language: str
    icon: Optional[str]
    order: int
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
