"""
Voice analysis endpoints (Phase 11).

POST /analyze/voice — upload a voice note, transcribe it with Whisper
                       (Phase 11), then classify the transcript through the
                       same decision engine used for text and image
                       messages.
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.db_models import MessageTypeEnum, SenderTypeEnum
from app.models.schemas import TranscriptionResult, VoiceAnalysisResponse
from app.repositories.message_repository import create_message, get_or_create_sender
from app.repositories.prediction_repository import upsert_prediction
from app.services.decision_engine import decide
from app.services.voice_service import transcribe_audio_bytes

router = APIRouter(tags=["voice"])

ALLOWED_CONTENT_TYPES = {
    "audio/ogg", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
    "audio/webm", "audio/m4a", "audio/mp4", "audio/x-m4a",
}


@router.post("/analyze/voice", response_model=VoiceAnalysisResponse)
async def analyze_voice(
    sender_name: str = Form(...),
    sender_type: SenderTypeEnum = Form(SenderTypeEnum.CONTACT),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> VoiceAnalysisResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400, detail=f"Unsupported audio type: {file.content_type}"
        )

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Uploaded audio is empty.")

    try:
        extraction = transcribe_audio_bytes(audio_bytes, filename_hint=file.filename or "audio.ogg")
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Transcription unavailable — the Whisper model may not be "
                f"downloaded yet (needs internet on first run). Detail: {exc}"
            ),
        ) from exc

    if not extraction.transcript:
        raise HTTPException(status_code=422, detail="No speech detected in the audio.")

    sender = get_or_create_sender(db, name=sender_name, sender_type=sender_type)
    message = create_message(
        db,
        sender=sender,
        content=extraction.transcript,
        message_type=MessageTypeEnum.VOICE,
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

    return VoiceAnalysisResponse(
        message_id=message.id,
        transcription=TranscriptionResult(
            transcript=extraction.transcript,
            language=extraction.language,
            duration_seconds=extraction.duration_seconds,
        ),
        action=result.action,
        reason=result.reason,
        confidence_score=result.confidence_score,
        scam_probability=result.scam_probability,
        spam_probability=result.spam_probability,
        urgency_score=result.urgency_score,
    )