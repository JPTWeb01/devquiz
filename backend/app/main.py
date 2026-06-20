from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.routers import admin, ai, auth, courses, quiz, questions, schedule, topics, users

limiter = Limiter(key_func=get_remote_address)


def _ensure_schema():
    """Add any missing columns that weren't in the original Alembic init migration."""
    from app.database import engine
    from sqlalchemy import text

    _ddl = [
        "ALTER TABLE weekly_schedules ADD COLUMN question_type VARCHAR(30) NOT NULL DEFAULT ''",
        "ALTER TABLE questions ADD COLUMN published_at DATETIME NULL",
    ]
    for stmt in _ddl:
        try:
            with engine.connect() as conn:
                conn.execute(text(stmt))
                conn.commit()
        except Exception:
            pass  # Column already exists — safe to ignore


@asynccontextmanager
async def lifespan(app: FastAPI):
    _ensure_schema()
    from app.services.scheduler import start, stop
    start(hour=0, minute=0)  # runs daily at midnight UTC
    yield
    stop()


app = FastAPI(
    title="DevQuiz API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(topics.router, prefix="/api/topics", tags=["topics"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["schedule"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])


@app.get("/health")
def health():
    return {"status": "ok"}
