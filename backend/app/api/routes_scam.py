"""
Scam detection endpoints (Phase 9).

GET /scam-check — run the trained scam classifier on ad-hoc text.
"""
from fastapi import APIRouter, Query

from app.models.schemas import ScamCheckOut
from app.services.scam_detection import predict_scam_probability

router = APIRouter(tags=["scam"])


@router.get("/scam-check", response_model=ScamCheckOut)
def scam_check(content: str = Query(..., description="Text to classify")) -> ScamCheckOut:
    probability = predict_scam_probability(content)
    return ScamCheckOut(content=content, ml_scam_probability=probability)