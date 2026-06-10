import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class WeeklySchedule(Base):
    __tablename__ = "weekly_schedules"
    __table_args__ = (
        UniqueConstraint("day_of_week", "topic_id", name="uq_day_topic"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    day_of_week = Column(Integer, nullable=False)  # 0=Monday … 6=Sunday
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    question_count = Column(Integer, default=5, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    topic = relationship("Topic")
