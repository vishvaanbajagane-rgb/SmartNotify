"""
Centralized application configuration.
Reads from environment variables / .env file.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # -------------------------
    # Application
    # -------------------------
    APP_NAME: str = "SmartNotify AI"
    ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # -------------------------
    # CORS
    # -------------------------
    CORS_ORIGINS: str = "http://localhost:3000"

    # -------------------------
    # Authentication (JWT)
    # -------------------------
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # -------------------------
    # Database
    # -------------------------
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/smartnotify"

    # -------------------------
    # Paths
    # -------------------------
    DATASET_PATH: str = "dataset/messages.csv"
    OUTPUT_PATH: str = "output/output.csv"
    ML_MODELS_DIR: str = "ml_models"

    # -------------------------
    # AI Models
    # -------------------------
    SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"
    WHISPER_MODEL_SIZE: str = "base"
    FAISS_INDEX_PATH: str = "ml_models/faiss_index.bin"

    # -------------------------
    # Optional APIs
    # -------------------------
    OPENAI_API_KEY: str | None = None
    GOOGLE_APPLICATION_CREDENTIALS: str | None = None

    # -------------------------
    # Decision Thresholds
    # -------------------------
    NOTIFY_CONFIDENCE_THRESHOLD: float = 0.65
    SCAM_BLOCK_THRESHOLD: float = 0.75

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()