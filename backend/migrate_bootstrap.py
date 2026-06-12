"""
Bootstrap script for Render deployments.

If the database has tables but no alembic_version history (i.e. it was set up
before Alembic was introduced), stamp it at the last known revision so that
`alembic upgrade head` only runs NEW migrations instead of trying to recreate
tables that already exist.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import inspect, text
from app.database import engine

# Last migration that was already applied to production before Alembic tracking began
STAMP_REVISION = "add_editor_role"


def main():
    with engine.connect() as conn:
        table_names = inspect(engine).get_table_names()

        if "alembic_version" in table_names:
            current = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
            print(f"[bootstrap] Alembic already tracked at: {current}")
            return

        if "courses" in table_names:
            # Existing DB with no migration history — stamp at known good revision
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
            print(f"[bootstrap] Stamped existing DB at revision: {STAMP_REVISION}")
        else:
            print("[bootstrap] Fresh DB detected — Alembic will create all tables.")


if __name__ == "__main__":
    main()
