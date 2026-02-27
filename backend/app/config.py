from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]


def _strip_optional_quotes(value: str) -> str:
    return value.strip().strip('"').strip("'")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_DIR / ".env"), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    sqlite_db_path: str = "app/data/agrismart.db"

    model_path: str = "app/ml/model.joblib"

    llm_provider: str = "groq"
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_timeout_seconds: int = Field(default=30, ge=3, le=180)

    cors_origins: str = "http://localhost:5173"
    log_level: str = "INFO"
    hide_docs: bool = False


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.llm_provider = _strip_optional_quotes(settings.llm_provider).lower()
    settings.groq_api_key = _strip_optional_quotes(settings.groq_api_key)
    settings.groq_model = _strip_optional_quotes(settings.groq_model)
    settings.ollama_base_url = _strip_optional_quotes(settings.ollama_base_url)
    settings.ollama_model = _strip_optional_quotes(settings.ollama_model)
    return settings
