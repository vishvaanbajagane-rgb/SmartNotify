"""
Prediction endpoints.

POST /predict          — classify a single ad-hoc message (creates it in DB too)
POST /predict/batch     — run the decision engine over every ingested message
GET  /predict/{msg_id}  — fetch a stored prediction
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.db_models import MessageTypeEnum, SenderTypeEnum
from app.models.schemas import BatchPredictResponse, PredictionOut, PredictionRequest
from app.repositories.message_repository import (
    create_message,
    get_message_by_id,
    get_or_create_sender,
    list_all_messages_with_sender,
)
from app.repositories.prediction_repository import get_prediction_by_message_id, upsert_prediction
from app.services.decision_engine import DecisionResult, decide

router = APIRouter(tags=["prediction"])


def _save_and_build_response(db: Session, message_id: str, result: DecisionResult) -> PredictionOut:
    upsert_prediction(
        db,
        message_id=message_id,
        action=result.action,
        reason=result.reason,
        confidence_score=result.confidence_score,
        evidence_message_ids=result.evidence_message_ids,
        business_trust_score=result.business_trust_score,
        spam_probability=result.spam_probability,
        scam_probability=result.scam_probability,
        urgency_score=result.urgency_score,
    )
    return PredictionOut(
        message_id=message_id,
        action=result.action,
        reason=result.reason,
        confidence_score=result.confidence_score,
        evidence_message_ids=result.evidence_message_ids,
        business_trust_score=result.business_trust_score,
        spam_probability=result.spam_probability,
        scam_probability=result.scam_probability,
        urgency_score=result.urgency_score,
    )


@router.post("/predict", response_model=PredictionOut)
def predict_single(payload: PredictionRequest, db: Session = Depends(get_db)) -> PredictionOut:
    sender = get_or_create_sender(
        db,
        name=payload.sender_name,
        sender_type=SenderTypeEnum(payload.sender_type.value),
    )
    message = create_message(
        db,
        sender=sender,
        content=payload.content,
        message_type=MessageTypeEnum(payload.message_type.value),
        group_name=payload.group_name,
        forward_count=payload.forward_count,
    )
    db.flush()
    message.sender = sender

    result = decide(message)
    response = _save_and_build_response(db, message.id, result)
    db.commit()
    return response


@router.post("/predict/batch", response_model=BatchPredictResponse)
def predict_batch(db: Session = Depends(get_db)) -> BatchPredictResponse:
    messages = list_all_messages_with_sender(db)
    if not messages:
        raise HTTPException(
            status_code=404,
            detail="No messages found. Upload a dataset first via POST /upload (Phase 3).",
        )

    predictions: list[PredictionOut] = []
    for message in messages:
        result = decide(message)
        predictions.append(_save_and_build_response(db, message.id, result))

    db.commit()
    return BatchPredictResponse(total_processed=len(predictions), predictions=predictions)


@router.get("/predict/{message_id}", response_model=PredictionOut)
def get_prediction(message_id: str, db: Session = Depends(get_db)) -> PredictionOut:
    message = get_message_by_id(db, message_id)
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found.")

    prediction = get_prediction_by_message_id(db, message_id)
    if prediction is None:
        raise HTTPException(
            status_code=404,
            detail="No prediction yet for this message. Run POST /predict/batch first.",
        )

    return PredictionOut(
        message_id=prediction.message_id,
        action=prediction.action,
        reason=prediction.reason,
        confidence_score=prediction.confidence_score,
        evidence_message_ids=prediction.evidence_ids_list,
        business_trust_score=prediction.business_trust_score,
        spam_probability=prediction.spam_probability,
        scam_probability=prediction.scam_probability,
        urgency_score=prediction.urgency_score,
    )