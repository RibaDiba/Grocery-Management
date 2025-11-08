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
    """
    Check if Tesseract OCR is installed and available.
    
    Returns:
        bool: True if Tesseract is available, False otherwise.
    """
    try:
        # Try to find tesseract executable
        tesseract_cmd = shutil.which("tesseract")
        if tesseract_cmd:
            # Verify it works by running version command
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
    """
    Preprocess image to improve OCR accuracy.
    
    Args:
        image: Input image as numpy array
        method: Preprocessing method to use
        
    Returns:
        Preprocessed image as numpy array
    """
    # Convert to grayscale if needed
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    
    if method == "thresh":
        # Apply binary threshold
        _, processed = cv2.threshold(
            gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
    elif method == "blur":
        # Apply Gaussian blur then threshold
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        _, processed = cv2.threshold(
            blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
    elif method == "adaptive":
        # Apply adaptive threshold
        processed = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )
    else:  # method == "none"
        processed = gray
    
    return processed


def ocr_image(file_path: Path | str, preprocess: PreprocessMethod = "thresh") -> str:
    """
    Perform OCR on an image file.
    
    Args:
        file_path: Path to the image file
        preprocess: Preprocessing method to apply before OCR
        
    Returns:
        Extracted text from the image
        
    Raises:
        FileNotFoundError: If the image file doesn't exist
        ValueError: If the image cannot be loaded
        RuntimeError: If OCR processing fails
    """
    file_path = Path(file_path)
    
    if not file_path.exists():
        raise FileNotFoundError(f"Image file not found: {file_path}")
    
    try:
        # Load image with PIL first to handle various formats
        pil_image = Image.open(file_path)
        
        # Convert PIL image to numpy array for OpenCV processing
        image_array = np.array(pil_image)
        
        # Convert RGB to BGR if needed (OpenCV uses BGR)
        if len(image_array.shape) == 3 and image_array.shape[2] == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
    except Exception as e:
        raise ValueError(f"Failed to load image: {str(e)}")
    
    try:
        # Preprocess the image
        processed_image = preprocess_image(image_array, preprocess)
        
        # Convert back to PIL Image for pytesseract
        pil_processed = Image.fromarray(processed_image)
        
        # Perform OCR with custom configuration for better receipt recognition
        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(pil_processed, config=custom_config)
        
        return text.strip()
        
    except Exception as e:
        raise RuntimeError(f"OCR processing failed: {str(e)}")