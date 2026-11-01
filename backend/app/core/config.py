from pydantic_settings import BaseSettings, SettingsConfigDict



class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    tinyfish_api_key: str = ""
    tinyfish_base_url: str = "https://agent.tinyfish.ai"
    tinyfish_timeout_seconds: int = 300
    frontend_origin: str = "http://localhost:5173"


def get_settings() -> Settings:
    return Settings()
