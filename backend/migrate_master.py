from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_master BOOLEAN NOT NULL DEFAULT FALSE"))
    conn.execute(text("UPDATE users SET is_master = TRUE WHERE email = 'josepaulotimbang@gmail.com'"))
    conn.commit()

    result = conn.execute(text("SELECT email, role, is_master FROM users WHERE is_master = TRUE"))
    for row in result:
        print(f"Master admin set: {row[0]} ({row[1]})")
