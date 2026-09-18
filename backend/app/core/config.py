"""
BIS SmartSpec AI - Application Configuration
"""
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings
from functools import lru_cache
import os



class Settings(BaseSettings):
    # App
    APP_NAME: str = "BIS SmartSpec AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./data/bis_smartspec.db"

    # Vector DB
    VECTOR_DB_PATH: str = "./chroma_db"
    COLLECTION_NAME: str = "bis_standards"

    # Embedding
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # LLM Provider: "ollama", "mock"
    LLM_PROVIDER: str = "mock"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:3b"
    LLM_API_KEY: str = ""

    # Retrieval weights (must sum ≈ 1.0)
    SEMANTIC_WEIGHT: float = 0.65
    LEXICAL_WEIGHT: float = 0.20
    METADATA_WEIGHT: float = 0.15

    # Upload
    MAX_UPLOAD_MB: int = 20
    UPLOAD_DIR: str = "./uploads"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def validate_cors_origins(cls, v) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return list(v)


    # API
    API_PREFIX: str = "/api"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
