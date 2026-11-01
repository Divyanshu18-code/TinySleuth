from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else ".env",
        extra="ignore",
    )

    tinyfish_api_key: str = ""
    tinyfish_base_url: str = "https://agent.tinyfish.ai"
    tinyfish_timeout_seconds: int = 90
    frontend_origin: str = "http://localhost:5173"


def get_settings() -> Settings:
    return Settings()
