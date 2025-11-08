import shutil
import subprocess
from pathlib import Path
from typing import Literal

import cv2
import numpy as np
import pytesseract
from PIL import Image


PreprocessMethod = Literal["thresh", "blur", "adaptive", "none"]


def check_tesseract_available() -> bool:
    try:
        tesseract_cmd = shutil.which("tesseract")
        if tesseract_cmd:
            result = subprocess.run(
                ["tesseract", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        return False
    except Exception:
        return False


def preprocess_image(image: np.ndarray, method: PreprocessMethod = "thresh") -> np.ndarray:
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image  
    if method == "thresh":
        _, processed = cv2.threshold(
            gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
    elif method == "blur":
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        _, processed = cv2.threshold(
            blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
    elif method == "adaptive":
        processed = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )
    else:
        processed = gray
    
    return processed


def ocr_image(file_path: Path | str, preprocess: PreprocessMethod = "thresh") -> str:
    file_path = Path(file_path)
    
    if not file_path.exists():
        raise FileNotFoundError(f"Image file not found: {file_path}")
    
    try:
        pil_image = Image.open(file_path)
        image_array = np.array(pil_image)
        if len(image_array.shape) == 3 and image_array.shape[2] == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
    except Exception as e:
        raise ValueError(f"Failed to load image: {str(e)}")
    
    try:
        processed_image = preprocess_image(image_array, preprocess)
        pil_processed = Image.fromarray(processed_image)
        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(pil_processed, config=custom_config)
        
        return text.strip()
        
    except Exception as e:
        raise RuntimeError(f"OCR processing failed: {str(e)}")