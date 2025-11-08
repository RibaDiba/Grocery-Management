import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()


def _env_str(key: str, default: str = "") -> str:
    """Get an env var as a cleaned string (strips surrounding quotes and whitespace)."""
    val = os.getenv(key, default)
    if val is None:
        return ""
    # Trim whitespace and one layer of surrounding quotes if present
    v = val.strip()
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        v = v[1:-1]
    return v.strip()


def _env_int(key: str, default: int | None = None) -> int | None:
    s = _env_str(key, "")
    if s == "":
        return default
    try:
        return int(s)
    except ValueError:
        return default


def _env_float(key: str, default: float | None = None) -> float | None:
    s = _env_str(key, "")
    if s == "":
        return default
    try:
        return float(s)
    except ValueError:
        return default


class Config:
    GEMINI_API_KEY: str = _env_str("GEMINI_API_KEY", "")
    SECRET_KEY: str = _env_str("SECRET_KEY", "")
    MONGO_URI: str = _env_str("MONGO_URI", "")
    MONGO_DB_NAME: str = _env_str("MONGO_DB_NAME", "grocery_db")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    MAX_FILE_SIZE_MB: int = _env_int("MAX_FILE_SIZE_MB", 10) or 10
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
    ALLOWED_EXTENSIONS: set[str] = set(
        _env_str("ALLOWED_EXTENSIONS", "jpg,jpeg,png,pdf").split(",")
    )

    UPLOAD_DIR: Path = Path(__file__).parent / "uploads"

    OCR_PREPROCESS_METHOD: str = _env_str("OCR_PREPROCESS_METHOD", "thresh")
    LLM_MODEL: str = _env_str("LLM_MODEL", "")
    LLM_MAX_TOKENS: int | None = _env_int("LLM_MAX_TOKENS", None)
    LLM_TEMPERATURE: float | None = _env_float("LLM_TEMPERATURE", None)
    
    @classmethod
    def validate(cls) -> list[str]:
        errors = []

        if not (cls.GEMINI_API_KEY):
            errors.append("GEMINI_API_KEY is not set in environment variables (.env)")
        if not (cls.SECRET_KEY):
            errors.append("SECRET_KEY is not set in environment variables (.env)")
        if not (cls.MONGO_URI):
            errors.append("MONGO_URI is not set in environment variables (.env)")
        if not cls.LLM_MODEL:
            errors.append("LLM_MODEL is not set in environment variables (.env)")

        if cls.LLM_MAX_TOKENS is None:
            errors.append("LLM_MAX_TOKENS is not set or invalid in environment variables (.env)")

        if cls.LLM_TEMPERATURE is None:
            errors.append("LLM_TEMPERATURE is not set or invalid in environment variables (.env)")
        
        return errors
    
    @classmethod
    def ensure_upload_dir(cls) -> None:
        cls.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


config = Config()