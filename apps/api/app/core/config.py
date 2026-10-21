import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings and configuration."""
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Master_PDF API"
    VERSION: str = "0.1.0"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Temporary directory for job artifacts & uploads
    TEMP_DIR: str = str(Path(__file__).resolve().parent.parent.parent / "data" / "tmp")
    # Time to live for temporary files before automatic purge (in minutes)
    TEMP_FILE_TTL_MINUTES: int = 30

    # Max upload limit in megabytes
    MAX_UPLOAD_SIZE_MB: int = 150

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "capacitor://localhost",
        "ionic://localhost",
    ]


settings = Settings()

# Ensure temp directory exists upon import
os.makedirs(settings.TEMP_DIR, exist_ok=True)
