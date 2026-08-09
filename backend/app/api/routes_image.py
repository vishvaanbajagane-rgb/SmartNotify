"""
Image analysis endpoints (Phase 10).

POST /analyze/image — upload an image, run OCR (Phase 10), then classify
                       the extracted text through the same decision engine
                       used for text messages (Phase 5), so images get the
                       same Notify/Digest/Mute treatment.
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.db_models import MessageTypeEnum, SenderTypeEnum
from app.models.schemas import ImageAnalysisResponse, OCRResult
from app.repositories.message_repository import create_message, get_or_create_sender
from app.repositories.prediction_repository import upsert_prediction
from app.services.decision_engine import decide
from app.services.ocr_service import extract_text_from_image_bytes

router = APIRouter(tags=["image"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


@router.post("/analyze/image", response_model=ImageAnalysisResponse)
async def analyze_image(
    sender_name: str = Form(...),
    sender_type: SenderTypeEnum = Form(SenderTypeEnum.CONTACT),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ImageAnalysisResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400, detail=f"Unsupported image type: {file.content_type}"
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    try:
        extraction = extract_text_from_image_bytes(image_bytes)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail=(
                "OCR unavailable — the EasyOCR model may not be downloaded "
                f"yet (needs internet on first run). Detail: {exc}"
            ),
        ) from exc

    if not extraction.extracted_text:
        raise HTTPException(status_code=422, detail="No readable text found in the image.")

    sender = get_or_create_sender(db, name=sender_name, sender_type=sender_type)
    message = create_message(
        db,
        sender=sender,
        content=extraction.extracted_text,
        message_type=MessageTypeEnum.IMAGE,
    )
    db.flush()
    message.sender = sender

    result = decide(message, db=db)

    upsert_prediction(
        db,
        message_id=message.id,
        action=result.action,
        reason=result.reason,
        confidence_score=result.confidence_score,
        evidence_message_ids=result.evidence_message_ids,
        business_trust_score=result.business_trust_score,
        spam_probability=result.spam_probability,
        scam_probability=result.scam_probability,
        urgency_score=result.urgency_score,
    )
    db.commit()

    return ImageAnalysisResponse(
        message_id=message.id,
        ocr=OCRResult(
            extracted_text=extraction.extracted_text,
            detected_language=extraction.detected_language,
            confidence=extraction.confidence,
        ),
        action=result.action,
        reason=result.reason,
        confidence_score=result.confidence_score,
        scam_probability=result.scam_probability,
        spam_probability=result.spam_probability,
        urgency_score=result.urgency_score,
    )
