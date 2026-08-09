"""
Data-access layer for predictions.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.db_models import ActionEnum, Prediction


def upsert_prediction(
    db: Session,
    message_id: str,
    action: ActionEnum,
    reason: str,
    confidence_score: float,
    evidence_message_ids: list[str],
    business_trust_score: float,
    spam_probability: float,
    scam_probability: float,
    urgency_score: float,
) -> Prediction:
    """Create a prediction for a message, or overwrite the existing one.

    Overwriting matters because /predict/batch can be re-run after Phases
    6-9 improve the underlying models — you always want the latest decision.
    """
    existing = db.execute(
        select(Prediction).where(Prediction.message_id == message_id)
    ).scalar_one_or_none()

    evidence_str = ",".join(evidence_message_ids)

    if existing:
        existing.action = action
        existing.reason = reason
        existing.confidence_score = confidence_score
        existing.evidence_message_ids = evidence_str
        existing.business_trust_score = business_trust_score
        existing.spam_probability = spam_probability
        existing.scam_probability = scam_probability
        existing.urgency_score = urgency_score
        db.flush()
        return existing

    prediction = Prediction(
        message_id=message_id,
        action=action,
        reason=reason,
        confidence_score=confidence_score,
        evidence_message_ids=evidence_str,
        business_trust_score=business_trust_score,
        spam_probability=spam_probability,
        scam_probability=scam_probability,
        urgency_score=urgency_score,
    )
    db.add(prediction)
    db.flush()
    return prediction


def get_prediction_by_message_id(db: Session, message_id: str) -> Prediction | None:
    return db.execute(
        select(Prediction).where(Prediction.message_id == message_id)
    ).scalar_one_or_none()


def list_predictions(db: Session) -> list[Prediction]:
    return list(db.execute(select(Prediction)).scalars().all())


def get_predictions_by_message_ids(db: Session, message_ids: list[str]) -> list[Prediction]:
    if not message_ids:
        return []
    return list(
        db.execute(select(Prediction).where(Prediction.message_id.in_(message_ids))).scalars().all()
    )
