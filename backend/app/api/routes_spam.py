"""
Spam detection endpoints (Phase 8, retrain endpoint added Phase 15).

GET  /spam-check          — run the trained classifier on ad-hoc text
POST /spam-check/retrain  — retrain on seed data + new labeled examples
                             (protected — requires login)
"""
from fastapi import APIRouter, Depends, Query

from app.core.deps import get_current_user
from app.models.db_models import User
from app.models.schemas import RetrainRequest, RetrainResponse, SpamCheckOut
from app.services.spam_detection import predict_spam_probability, retrain_from_examples

router = APIRouter(tags=["spam"])


@router.get("/spam-check", response_model=SpamCheckOut)
def spam_check(content: str = Query(..., description="Text to classify")) -> SpamCheckOut:
    probability = predict_spam_probability(content)
    return SpamCheckOut(content=content, ml_spam_probability=probability)


@router.post("/spam-check/retrain", response_model=RetrainResponse)
def retrain_spam_model(
    payload: RetrainRequest,
    current_user: User = Depends(get_current_user),
) -> RetrainResponse:
    texts = [e.text for e in payload.examples]
    labels = [e.label for e in payload.examples]
    total = retrain_from_examples(texts, labels)
    return RetrainResponse(
        total_training_examples=total,
        message=f"Spam classifier retrained on {total} examples ({len(texts)} newly added).",
    )

