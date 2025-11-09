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
            "health": "/health",
            "docs": "/docs"
        }
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