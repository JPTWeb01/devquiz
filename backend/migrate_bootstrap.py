"""
Bootstrap script for Render deployments.

Runs before uvicorn on every deploy. Handles:
1. Stamp alembic_version if DB exists but has no migration history.
2. Ensure weekly_schedules table exists (was never in Alembic init migration).
3. Ensure question_type column exists on weekly_schedules.

All operations are idempotent — safe to re-run on every deploy.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

STAMP_REVISION = "add_editor_role"


def scalar(conn, sql, params=None):
    result = conn.execute(text(sql), params or {})
    return result.scalar()


def table_exists(conn, table: str) -> bool:
    return scalar(
        conn,
        "SELECT COUNT(*) FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t",
        {"t": table},
    ) > 0


def column_exists(conn, table: str, column: str) -> bool:
    return scalar(
        conn,
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :t AND COLUMN_NAME = :c",
        {"t": table, "c": column},
    ) > 0


def main():
    with engine.connect() as conn:

        # ── 1. Stamp alembic history if missing ──────────────────────────
        if not table_exists(conn, "alembic_version"):
            if table_exists(conn, "courses"):
                conn.execute(text(
                    "CREATE TABLE alembic_version ("
                    "  version_num VARCHAR(32) NOT NULL,"
                    "  CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)"
                    ")"
                ))
                conn.execute(
                    text("INSERT INTO alembic_version (version_num) VALUES (:rev)"),
                    {"rev": STAMP_REVISION},
                )
                conn.commit()
                print(f"[bootstrap] Stamped existing DB at: {STAMP_REVISION}")
            else:
                print("[bootstrap] Fresh DB — skipping stamp.")
        else:
            current = scalar(conn, "SELECT version_num FROM alembic_version")
            print(f"[bootstrap] Alembic version: {current}")

        # ── 2. Create weekly_schedules if it doesn't exist ───────────────
        if not table_exists(conn, "weekly_schedules"):
            conn.execute(text("""
                CREATE TABLE weekly_schedules (
                    id VARCHAR(36) NOT NULL,
                    day_of_week INT NOT NULL,
                    topic_id VARCHAR(36) NOT NULL,
                    question_count INT NOT NULL DEFAULT 5,
                    question_type VARCHAR(30) NOT NULL DEFAULT '',
                    is_active TINYINT(1) NOT NULL DEFAULT 1,
                    last_run_at DATETIME NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    CONSTRAINT uq_day_topic UNIQUE (day_of_week, topic_id),
                    CONSTRAINT fk_ws_topic FOREIGN KEY (topic_id)
                        REFERENCES topics(id) ON DELETE CASCADE
                )
            """))
            conn.commit()
            print("[bootstrap] Created weekly_schedules table.")
        else:
            print("[bootstrap] weekly_schedules table exists.")

            # ── 3. Add question_type column if missing ───────────────────
            if not column_exists(conn, "weekly_schedules", "question_type"):
                conn.execute(text(
                    "ALTER TABLE weekly_schedules "
                    "ADD COLUMN question_type VARCHAR(30) NOT NULL DEFAULT ''"
                ))
                conn.commit()
                print("[bootstrap] Added question_type column.")
            else:
                print("[bootstrap] question_type column already exists.")


if __name__ == "__main__":
    main()
