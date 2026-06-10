from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]
    DEBUG: bool = False
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    AI_DAILY_LIMIT: int = 20

    model_config = {"env_file": ".env"}


settings = Settings()
