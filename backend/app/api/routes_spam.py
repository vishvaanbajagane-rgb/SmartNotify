"""
Spam detection endpoints (Phase 8).

GET /spam-check — run the trained classifier on ad-hoc text.
"""
from fastapi import APIRouter, Query

from app.models.schemas import SpamCheckOut
from app.services.spam_detection import predict_spam_probability

router = APIRouter(tags=["spam"])


@router.get("/spam-check", response_model=SpamCheckOut)
def spam_check(content: str = Query(..., description="Text to classify")) -> SpamCheckOut:
    probability = predict_spam_probability(content)
    return SpamCheckOut(content=content, ml_spam_probability=probability)