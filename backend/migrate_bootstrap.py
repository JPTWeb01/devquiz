"""
Bootstrap script for Render deployments.

Handles two jobs:
1. Stamp alembic_version if the DB exists but has no migration history.
2. Apply any schema changes that aren't yet in the DB, using safe SQL
   (checks before altering so it is always safe to re-run).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import inspect, text
from app.database import engine

STAMP_REVISION = "add_editor_role"


def column_exists(conn, table: str, column: str) -> bool:
    result = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    ), {"table": table, "column": column})
    return result.scalar() > 0


def table_exists(conn, table: str) -> bool:
    result = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table"
    ), {"table": table})
    return result.scalar() > 0


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
            current = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
            print(f"[bootstrap] Alembic version: {current}")

        # ── 2. Add question_type to weekly_schedules if missing ──────────
        if table_exists(conn, "weekly_schedules"):
            if not column_exists(conn, "weekly_schedules", "question_type"):
                conn.execute(text(
                    "ALTER TABLE weekly_schedules "
                    "ADD COLUMN question_type VARCHAR(30) NOT NULL DEFAULT ''"
                ))
                conn.commit()
                print("[bootstrap] Added question_type column to weekly_schedules.")
            else:
                print("[bootstrap] question_type column already exists.")
        else:
            print("[bootstrap] weekly_schedules table not found — will be created by Alembic.")


if __name__ == "__main__":
    main()
