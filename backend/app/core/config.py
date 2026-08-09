"""
Centralized application configuration.
Reads from environment variables / .env file.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "SmartNotify AI"
    ENV: str = "development"  # development | production
    API_V1_PREFIX: str = "/api/v1"

    # --- CORS ---
    # Comma-separated origins allowed to call this API (your Next.js frontend)
    CORS_ORIGINS: str = "http://localhost:3000"

    # --- Database ---
    # Example: postgresql+psycopg2://user:password@localhost:5432/smartnotify
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/smartnotify"

    # --- Paths ---
    DATASET_PATH: str = "dataset/messages.csv"
    OUTPUT_PATH: str = "output/output.csv"
    ML_MODELS_DIR: str = "ml_models"

    # --- ML / Model settings ---
    SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"
    WHISPER_MODEL_SIZE: str = "base"  # tiny | base | small | medium | large
    FAISS_INDEX_PATH: str = "ml_models/faiss_index.bin"

    # --- Optional external API keys (only needed if you opt into paid services) ---
    OPENAI_API_KEY: str | None = None
    GOOGLE_APPLICATION_CREDENTIALS: str | None = None

    # --- Decision thresholds (tunable) ---
    # Updated in Phase 15 based on scripts/evaluate_thresholds.py: the
    # original 0.65/0.75 defaults scored 67% on the labeled eval set (missed
    # both scam messages, landing them in Digest instead of Mute). Lowering
    # SCAM_BLOCK_THRESHOLD to 0.50 scored 100% on that set. Caveat: the eval
    # set only has 6 examples — re-run the script as you add more labeled
    # cases, and don't treat 100% on 6 examples as a ceiling.
    NOTIFY_CONFIDENCE_THRESHOLD: float = 0.55
    SCAM_BLOCK_THRESHOLD: float = 0.50

    # --- Authentication (JWT) ---
    JWT_SECRET_KEY: str = "change-this-in-production-to-a-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours, fine for a demo app

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance so we don't re-parse .env on every call."""
    return Settings()
