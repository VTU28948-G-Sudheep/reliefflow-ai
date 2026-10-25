import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "ReliefFlow AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database: Supports PostgreSQL (e.g. postgresql://user:pass@localhost:5432/reliefflow)
    # Defaults to local SQLite if DATABASE_URL is not set or empty.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./reliefflow.db")
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "https://reliefflow-ai.vercel.app",
        "*"
    ]
    
    # Safety & Prototype notices
    IS_PROTOTYPE: bool = True
    DISCLAIMER: str = (
        "PROTOTYPE NOTICE: ReliefFlow AI is an emergency response planning prototype for demonstration "
        "and training purposes. It is NOT an official dispatch or emergency service. All danger assessments "
        "are heuristic rule-based recommendations requiring human verification before dispatch."
    )

settings = Settings()
