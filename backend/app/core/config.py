from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    app_name: str = 'HostelSync API'
    secret_key: str = 'change-me-super-secret'
    algorithm: str = 'HS256'
    access_token_expire_minutes: int = 60 * 12

    database_url: str = 'postgresql+asyncpg://hostelsync:hostelsync@db:5432/hostelsync'
    cors_origins: str = 'http://localhost:3000'


settings = Settings()
