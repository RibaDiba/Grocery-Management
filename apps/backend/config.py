import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()


class Config:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
    ALLOWED_EXTENSIONS: set[str] = set(
        os.getenv("ALLOWED_EXTENSIONS", "jpg,jpeg,png,pdf").split(",")
    )

    UPLOAD_DIR: Path = Path(__file__).parent / "uploads"

    OCR_PREPROCESS_METHOD: str = os.getenv("OCR_PREPROCESS_METHOD", "thresh")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "")
    _LLM_MAX_TOKENS_RAW: str = os.getenv("LLM_MAX_TOKENS", "")
    try:
        LLM_MAX_TOKENS: int | None = int(_LLM_MAX_TOKENS_RAW) if _LLM_MAX_TOKENS_RAW != "" else None
    except ValueError:
        LLM_MAX_TOKENS = None

    _LLM_TEMPERATURE_RAW: str = os.getenv("LLM_TEMPERATURE", "")
    try:
        LLM_TEMPERATURE: float | None = float(_LLM_TEMPERATURE_RAW) if _LLM_TEMPERATURE_RAW != "" else None
    except ValueError:
        LLM_TEMPERATURE = None
    
    @classmethod
    def validate(cls) -> list[str]:
        errors = []

        if not (cls.GEMINI_API_KEY):
            errors.append("GEMINI_API_KEY is not set in environment variables (.env)")
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