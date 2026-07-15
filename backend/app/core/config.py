from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Chat App API"
    app_env: str = "local"
    database_url: str = "sqlite:///./data/chat.db"
    openai_api_key: str = ""
    openai_base_url: str = ""
    openai_model: str = "gpt-4.1-mini"
    chat_max_history_messages: int = 20
    chat_context_max_chars: int = 24000
    chat_summary_max_chars: int = 4000
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
