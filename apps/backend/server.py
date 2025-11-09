import time
from pathlib import Path
from typing import Any
from fastapi import FastAPI, File, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from config import config
from ocr import ocr_image, check_tesseract_available
from receipt_parser import ReceiptParser
from auth import router as auth_router, get_current_user, User
from groceries import router as groceries_router
from receipts import router as receipts_router
from pydantic import BaseModel
import re


app = FastAPI(title="grocery-backend")
app.include_router(auth_router)
app.include_router(groceries_router)
app.include_router(receipts_router)
    
# Dynamically import recipes router to avoid static import path issues
try:
    import importlib
    _recipes_mod = importlib.import_module("recipes")
    app.include_router(getattr(_recipes_mod, "router"))
except Exception:
    # If recipes module is unavailable, continue without it
    pass
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.on_event("startup")
async def startup_event():
    errors = config.validate()
    if errors:
        print("Configuration errors:")
        for error in errors:
            print(f"  - {error}")
        raise RuntimeError("Invalid configuration.")

    if not check_tesseract_available():
        raise RuntimeError(
            "Install Tesseract OCR before running"
        )
    config.ensure_upload_dir()
    
    print("API started successfully")


@app.get("/")
async def root():
    return {
        "name": "grocery-backend",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/api/receipt/upload",
            "analyze_text": "/api/receipt/analyze-text",
            "health": "/health",
            "docs": "/docs",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "tesseract_available": check_tesseract_available()
    }


@app.post("/api/receipt/upload")
async def upload_receipt(file: UploadFile = File(...), current_user: User = Depends(get_current_user)) -> JSONResponse:
    start_time = time.time()
    try:
        validate_file(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    file_path = save_upload_file(file, current_user.id)
    try:
        ocr_text = ocr_image(file_path, preprocess=config.OCR_PREPROCESS_METHOD)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {str(e)}"
        )

    try:
        receipt_parser = ReceiptParser(user_id=current_user.id)
        items = receipt_parser.parse_receipt_text(ocr_text)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Receipt parsing failed: {str(e)}"
        )

    grocery_item_ids = []
    # Persist extracted items to groceries collection (best-effort)
    try:
        grocery_item_ids = receipt_parser.add_groceries_to_db(items)
    except Exception as e:
        # Don't fail the request if persistence fails; just continue and return OCR result
        print(f"Warning: failed to persist groceries: {e}")

    # Create receipt document
    try:
        from database import get_receipts_collection
        from models import Receipt
        receipts_col = get_receipts_collection()
        receipt = Receipt(
            user_id=current_user.id,
            file_path=str(file_path),
            raw_text=ocr_text,
            grocery_items=grocery_item_ids
        )
        receipts_col.insert_one(receipt.dict())
    except Exception as e:
        # Don't fail the request if persistence fails
        print(f"Warning: failed to persist receipt doc: {e}")


    processing_time_ms = int((time.time() - start_time) * 1000)

    response_data = {
        "success": True,
        "items": items,
        "total_items": len(items),
        "raw_text": ocr_text,
        "processing_time_ms": processing_time_ms
    }
    
    return JSONResponse(content=response_data)


class AnalyzeTextRequest(BaseModel):
    text: str


@app.post("/api/receipt/analyze-text")
async def analyze_text(body: AnalyzeTextRequest, current_user: User = Depends(get_current_user)) -> JSONResponse:
    """
    Accepts multi-line text input with one grocery per line, optionally including a count.
    Examples of accepted line formats:
      - "Apples x 3"
      - "3 Apples"
      - "Milk - 2"
      - "Bread: 1"
      - "Yogurt, 4"
      - "Banana 5"

    If no count is present, defaults to 1. Empty or invalid lines are ignored.
    """
    start_time = time.time()
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    # Parse user-provided lines into items with name + count
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    items: list[dict[str, Any]] = []

    # Helper to clean bullet prefixes like '-', '*', '•', or '1. '
    bullet_re = re.compile(r"^(?:[-*•]\s+|\d+\.|\d+\)\s+)")
    # Patterns: leading count or trailing count with separators
    lead_count_re = re.compile(r"^(?P<count>\d+)\s*(?:x|×)?\s*(?P<name>.+)$", re.IGNORECASE)
    trail_count_re = re.compile(r"^(?P<name>.+?)\s*(?:x|×|:|,|-)?\s*(?P<count>\d+)\s*$", re.IGNORECASE)

    for raw in lines:
        line = bullet_re.sub("", raw).strip()
        if not line:
            continue

        name = None
        count = None

        m = lead_count_re.match(line)
        if m:
            try:
                count = int(m.group("count"))
            except ValueError:
                count = 1
            name = m.group("name").strip()
        else:
            m2 = trail_count_re.match(line)
            if m2:
                name = m2.group("name").strip()
                try:
                    count = int(m2.group("count"))
                except ValueError:
                    count = 1
            else:
                # No explicit count; entire line is the name
                name = line
                count = 1

        if not name:
            continue
        if count is None or count <= 0:
            count = 1

        # Normalize whitespace and trim quotes
        norm_name = name.strip().strip('"\'')
        if not norm_name:
            continue
        items.append({"name": norm_name, "count": count})

    # Persist groceries using existing upsert logic (now supports per-item count)
    grocery_item_ids: list[str] = []
    try:
        receipt_parser = ReceiptParser(user_id=current_user.id)
        grocery_item_ids = receipt_parser.add_groceries_to_db(items)
    except Exception as e:
        print(f"Warning: failed to persist groceries (text analysis): {e}")

    # Persist a receipt document noting it's from text input
    try:
        from database import get_receipts_collection
        from models import Receipt
        receipts_col = get_receipts_collection()
        synthetic_path = f"text://{int(time.time() * 1000)}"
        receipt = Receipt(
            user_id=current_user.id,
            file_path=synthetic_path,
            raw_text=text,
            grocery_items=grocery_item_ids,
        )
        receipts_col.insert_one(receipt.dict())
    except Exception as e:
        print(f"Warning: failed to persist receipt doc (text analysis): {e}")

    processing_time_ms = int((time.time() - start_time) * 1000)
    total_units = sum(i.get("count", 1) for i in items)
    return JSONResponse(
        content={
            "success": True,
            "items": items,
            "total_items": total_units,
            "raw_text": text,
            "processing_time_ms": processing_time_ms,
        }
    )


def validate_file(file: UploadFile) -> None:
    if not file.filename:
        raise ValueError("No filename provided")

    file_ext = Path(file.filename).suffix.lower().lstrip(".")
    if file_ext not in config.ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Invalid file type. Allowed: {', '.join(config.ALLOWED_EXTENSIONS)}"
        )
    
    if file.size and file.size > config.MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"File too large. Maximum size: {config.MAX_FILE_SIZE_MB}MB"
        )


def save_upload_file(file: UploadFile, user_id: str) -> Path:
    timestamp = int(time.time() * 1000)
    file_ext = Path(file.filename).suffix
    filename = f"receipt_{timestamp}{file_ext}"
    
    user_receipt_dir = config.UPLOAD_DIR / "receipts" / user_id
    user_receipt_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = user_receipt_dir / filename

    with open(file_path, "wb") as f:
        content = file.file.read()
        f.write(content)
    
    return file_path


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )