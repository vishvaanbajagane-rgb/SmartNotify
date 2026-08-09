"""
Scam detection endpoints (Phase 9, retrain endpoint added Phase 15).

GET  /scam-check          — run the trained scam classifier on ad-hoc text
POST /scam-check/retrain  — retrain on seed data + new labeled examples
                             (protected — requires login)
"""
from fastapi import APIRouter, Depends, Query

from app.core.deps import get_current_user
from app.models.db_models import User
from app.models.schemas import RetrainRequest, RetrainResponse, ScamCheckOut
from app.services.scam_detection import predict_scam_probability, retrain_from_examples

router = APIRouter(tags=["scam"])


@router.get("/scam-check", response_model=ScamCheckOut)
def scam_check(content: str = Query(..., description="Text to classify")) -> ScamCheckOut:
    probability = predict_scam_probability(content)
    return ScamCheckOut(content=content, ml_scam_probability=probability)


@router.post("/scam-check/retrain", response_model=RetrainResponse)
def retrain_scam_model(
    payload: RetrainRequest,
    current_user: User = Depends(get_current_user),
) -> RetrainResponse:
    texts = [e.text for e in payload.examples]
    labels = [e.label for e in payload.examples]
    total = retrain_from_examples(texts, labels)
    return RetrainResponse(
        total_training_examples=total,
        message=f"Scam classifier retrained on {total} examples ({len(texts)} newly added).",
    )

