from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    sqlite_db_path: str = "app/data/agrismart.db"

    model_path: str = "app/ml/model.joblib"

    llm_provider: str = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_timeout_seconds: int = Field(default=30, ge=3, le=180)

    cors_origins: str = "http://localhost:5173"
    log_level: str = "INFO"
    hide_docs: bool = False


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.llm_provider = settings.llm_provider.lower().strip()
    return settings
