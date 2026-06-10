import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)
_scheduler = BackgroundScheduler()


def run_daily_schedule():
    """Called once per day — generates questions for today's scheduled topics."""
    from app.core.config import settings
    from app.database import SessionLocal
    from app.models.question import Question
    from app.models.schedule import WeeklySchedule
    from app.services.ai_service import generate_questions

    if not settings.GROQ_API_KEY and not settings.GEMINI_API_KEY:
        logger.warning("Scheduler: no AI key configured, skipping.")
        return

    db = SessionLocal()
    try:
        today = datetime.now().weekday()  # 0=Monday … 6=Sunday
        entries = (
            db.query(WeeklySchedule)
            .filter(WeeklySchedule.day_of_week == today, WeeklySchedule.is_active == True)
            .all()
        )

        if not entries:
            logger.info("Scheduler: no entries for today (day %d).", today)
            return

        for entry in entries:
            topic = entry.topic
            if not topic or not topic.is_published:
                continue
            try:
                logger.info("Scheduler: generating %d questions for topic '%s'.", entry.question_count, topic.title)
                questions, provider = generate_questions(
                    content=f"Generate developer quiz questions about: {topic.title}. {topic.description or ''}",
                    count=entry.question_count,
                    groq_api_key=settings.GROQ_API_KEY,
                    gemini_api_key=settings.GEMINI_API_KEY,
                )
                for q in questions:
                    question = Question(
                        topic_id=topic.id,
                        type=q.get("type", "mcq"),
                        difficulty=q.get("difficulty", "easy"),
                        question_text=q.get("question_text", ""),
                        code_block=q.get("code_block"),
                        options=q.get("options"),
                        correct_answer=q.get("correct_answer", ""),
                        explanation=q.get("explanation", ""),
                        points=q.get("points", 10),
                        is_published=False,  # always draft — admin reviews before publishing
                    )
                    db.add(question)

                entry.last_run_at = datetime.now(timezone.utc)
                db.commit()
                logger.info("Scheduler: saved %d draft questions via %s for '%s'.", len(questions), provider, topic.title)
            except Exception as e:
                db.rollback()
                logger.error("Scheduler: failed for topic '%s': %s", topic.title, e)
    finally:
        db.close()


def start(hour: int = 0, minute: int = 0):
    """Start the background scheduler. hour/minute = UTC time to run daily."""
    if _scheduler.running:
        return
    _scheduler.add_job(
        run_daily_schedule,
        CronTrigger(hour=hour, minute=minute, timezone="UTC"),
        id="daily_question_gen",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Scheduler started — daily job at %02d:%02d UTC.", hour, minute)


def stop():
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")


def trigger_now():
    """Manually trigger today's schedule immediately."""
    run_daily_schedule()
