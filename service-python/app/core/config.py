from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración leída de variables de entorno."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "service-python"
    port: int = 8000
    database_url: str = "postgresql+asyncpg://analytics_user:analytics_secret@localhost:5432/reservas_analytics"
    db_pool_size: int = 5
    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
