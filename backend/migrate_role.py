from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
sql = "ALTER TABLE users MODIFY COLUMN role ENUM('STUDENT','EDITOR','ADMIN') NOT NULL DEFAULT 'STUDENT'"

with engine.connect() as conn:
    conn.execute(text(sql))
    conn.commit()
    print("Role enum updated — EDITOR added.")
