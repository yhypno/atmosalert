"""Application settings loaded from environment variables."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the API and inference pipeline."""

    environment: str = "development"
    log_level: str = "INFO"
    config_path: Path = Path("configs/default.yaml")
    model_path: Path = Path("models/nowcast-model")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="ATMOSALERT_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings instance."""

    return Settings()
