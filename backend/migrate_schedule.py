from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS weekly_schedules (
            id VARCHAR(36) PRIMARY KEY,
            day_of_week INTEGER NOT NULL,
            topic_id VARCHAR(36) NOT NULL,
            question_count INTEGER NOT NULL DEFAULT 5,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            last_run_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_day_topic UNIQUE (day_of_week, topic_id),
            CONSTRAINT fk_schedule_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
        )
    """))
    conn.commit()
    print("weekly_schedules table created.")
