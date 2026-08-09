"""
OCR service (Phase 10).

Extracts text from images (screenshots, forwarded images — a common
WhatsApp scam/spam vector) using EasyOCR, with OpenCV preprocessing to
improve accuracy on real-world screenshots.

EasyOCR downloads its detection + recognition model weights (~65MB total)
from its own GitHub-hosted release on first use — free, no API key, but
needs internet the first time (same one-time-download caveat as Phase 6's
embedding model). The reader is loaded lazily via `get_ocr_reader()` so the
app doesn't need it just to boot, and `get_ocr_reader` is intentionally a
thin, swappable function so it's easy to unit-test the rest of this pipeline
without waiting on the real model.
"""
from __future__ import annotations

import io
from dataclasses import dataclass
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image


@lru_cache
def get_ocr_reader():
    """Lazily load the EasyOCR reader. Only called the first time OCR is
    actually needed — not at app startup.
    """
    import easyocr

    return easyocr.Reader(["en"], gpu=False)


@dataclass
class OCRExtraction:
    extracted_text: str
    detected_language: str | None
    confidence: float


def bytes_to_cv2_image(image_bytes: bytes) -> np.ndarray:
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(pil_image)
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def preprocess_image(image: np.ndarray) -> np.ndarray:
    """Grayscale + denoise + adaptive threshold to boost OCR accuracy on
    screenshots and forwarded images — the most common WhatsApp image type
    this system needs to read (payment confirmations, "you won" graphics,
    fake bank notices, etc).
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    thresh = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 10
    )
    return thresh


def extract_text_from_image_bytes(image_bytes: bytes) -> OCRExtraction:
    image = bytes_to_cv2_image(image_bytes)
    processed = preprocess_image(image)

    reader = get_ocr_reader()
    results = reader.readtext(processed)  # list of (bbox, text, confidence)

    if not results:
        return OCRExtraction(extracted_text="", detected_language="en", confidence=0.0)

    texts = [r[1] for r in results]
    confidences = [r[2] for r in results]
    combined_text = " ".join(texts).strip()
    avg_confidence = sum(confidences) / len(confidences)

    return OCRExtraction(
        extracted_text=combined_text,
        detected_language="en",
        confidence=round(float(avg_confidence), 4),
    )
