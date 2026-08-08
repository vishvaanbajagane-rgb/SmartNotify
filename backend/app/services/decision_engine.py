"""
Decision engine — the heart of SmartNotify AI.

Combines:
- Phase 4: Feature Engineering
- Phase 6: Historical Retrieval / FAISS
- Phase 7: Business Trust
- Phase 8: Spam Detection
- Phase 9: Scam Detection

Produces:
- Notify / Digest / Mute
- confidence score
- human-readable reason
- historical evidence
- urgency score
- spam probability
- scam probability
- business trust score
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.models.schemas import Action
from app.services.business_trust import compute_business_trust_score
from app.services.confidence_scoring import compute_confidence
from app.services.feature_engineering import (
    MessageFeatures,
    extract_features,
)
from app.services.historical_retrieval import retrieve_similar_messages
from app.services.reason_generator import generate_reason
from app.services.scam_detection import predict_scam_probability
from app.services.spam_detection import predict_spam_probability


# -------------------------------------------------------------------
# Utility
# -------------------------------------------------------------------

def _clamp01(value: float) -> float:
    """Keep a value between 0 and 1."""
    return max(0.0, min(1.0, value))


# -------------------------------------------------------------------
# Decision Result
# -------------------------------------------------------------------

@dataclass
class DecisionResult:
    action: Action
    reason: str
    confidence_score: float
    evidence_message_ids: list[str]
    business_trust_score: float
    spam_probability: float
    scam_probability: float
    urgency_score: float


# -------------------------------------------------------------------
# Urgency
# -------------------------------------------------------------------

def compute_urgency_score(f: MessageFeatures) -> float:
    """
    Calculate urgency using interpretable message features.
    """

    score = 0.0

    score += min(f.urgency_keyword_count, 4) * 0.20

    if f.has_phone_number:
        score += 0.10

    if f.has_url:
        score += 0.05

    if f.is_direct_message:
        score += 0.10

    if f.is_verified_business:
        score += 0.10

    if f.message_length < 80:
        score += 0.05

    return round(_clamp01(score), 4)


# -------------------------------------------------------------------
# Spam
# -------------------------------------------------------------------

def compute_spam_probability(
    f: MessageFeatures,
    ml_spam_probability: float | None = None,
) -> float:
    """
    Combine heuristic spam detection with the ML spam detector.
    """

    score = 0.0

    score += min(f.spam_keyword_count, 5) * 0.15

    if f.forward_count >= 20:
        score += 0.25
    elif f.forward_count >= 5:
        score += 0.15

    if f.has_url:
        score += 0.10

    if f.sender_trust_score < 0.30:
        score += 0.15

    heuristic_score = _clamp01(score)

    if ml_spam_probability is not None:
        blended = (
            0.5 * heuristic_score
            + 0.5 * ml_spam_probability
        )
    else:
        blended = heuristic_score

    # Verified businesses are much less likely to be spam.
    if f.is_verified_business:
        blended *= 0.20

    return round(_clamp01(blended), 4)


# -------------------------------------------------------------------
# Scam
# -------------------------------------------------------------------

def compute_scam_probability(
    f: MessageFeatures,
    ml_scam_probability: float | None = None,
) -> float:
    """
    Combine heuristic scam detection with the ML scam detector.
    """

    score = 0.0

    score += min(f.scam_keyword_count, 4) * 0.15

    if f.forward_count >= 20:
        score += 0.20
    elif f.forward_count >= 5:
        score += 0.10

    if f.has_url and f.scam_keyword_count > 0:
        score += 0.10

    if f.has_phone_number and f.scam_keyword_count > 0:
        score += 0.05

    if f.sender_trust_score < 0.30:
        score += 0.10

    heuristic_score = _clamp01(score)

    if ml_scam_probability is not None:
        blended = (
            0.5 * heuristic_score
            + 0.5 * ml_scam_probability
        )
    else:
        blended = heuristic_score

    # Verified businesses are much less likely to be scams.
    if f.is_verified_business:
        blended *= 0.20

    return round(_clamp01(blended), 4)


# -------------------------------------------------------------------
# Main Decision Engine
# -------------------------------------------------------------------

def decide(
    message: Any,
    db: Session | None = None,
) -> DecisionResult:
    """
    Main SmartNotify AI decision pipeline.

    Message
        ↓
    Feature Engineering
        ↓
    Historical Retrieval
        ↓
    Business Trust
        ↓
    Spam Detection
        ↓
    Scam Detection
        ↓
    Decision
        ↓
    Confidence + Explanation
    """

    # ---------------------------------------------------------------
    # Phase 4 — Feature Engineering
    # ---------------------------------------------------------------

    features = extract_features(message)

    # ---------------------------------------------------------------
    # Phase 6 — Historical Retrieval / FAISS
    # ---------------------------------------------------------------

    evidence_message_ids: list[str] = []
    historical_similarity = 0.0

    if db is not None:
        try:
            retrieval = retrieve_similar_messages(
                db=db,
                message=message,
                top_k=5,
            )

            evidence_message_ids = [
                str(message_id)
                for message_id in retrieval.evidence_message_ids
            ]

            historical_similarity = float(
                retrieval.average_similarity
            )

        except Exception:
            # Historical retrieval must never crash prediction.
            evidence_message_ids = []
            historical_similarity = 0.0

    # ---------------------------------------------------------------
    # Phase 7 — Business Trust
    # ---------------------------------------------------------------

    try:
        business_trust = compute_business_trust_score(
            db=db,
            sender=message.sender,
        )
    except Exception:
        business_trust = features.sender_trust_score

    business_trust = _clamp01(float(business_trust))

    # Update feature trust score so Phase 8/9 can use it.
    features.sender_trust_score = business_trust

    # ---------------------------------------------------------------
    # Phase 8 — Spam Detection
    # ---------------------------------------------------------------

    try:
        ml_spam_probability = predict_spam_probability(
            message.content or ""
        )
    except Exception:
        ml_spam_probability = None

    # ---------------------------------------------------------------
    # Phase 9 — Scam Detection
    # ---------------------------------------------------------------

    try:
        ml_scam_probability = predict_scam_probability(
            message.content or ""
        )
    except Exception:
        ml_scam_probability = None

    # ---------------------------------------------------------------
    # Calculate final interpretable scores
    # ---------------------------------------------------------------

    urgency_score = compute_urgency_score(features)

    spam_probability = compute_spam_probability(
        features,
        ml_spam_probability,
    )

    scam_probability = compute_scam_probability(
        features,
        ml_scam_probability,
    )

    business_trust_score = round(
        business_trust,
        4,
    )

    # ---------------------------------------------------------------
    # Personalization from historical messages
    # ---------------------------------------------------------------

    personalization_bonus = (
        historical_similarity * 0.10
    )

    # ---------------------------------------------------------------
    # Routing scores
    # ---------------------------------------------------------------

    notify_score = (
        urgency_score * 0.40
        + business_trust_score * 0.30
        + personalization_bonus
    )

    digest_score = (
        (1.0 - urgency_score) * 0.25
        + business_trust_score * 0.25
        + personalization_bonus
    )

    mute_score = (
        spam_probability * 0.45
        + scam_probability * 0.45
        + (1.0 - business_trust_score) * 0.10
    )

    # ---------------------------------------------------------------
    # Final action
    # ---------------------------------------------------------------

    # Scam has highest priority.
    if scam_probability >= 0.75:
        action = Action.MUTE

    # Strong spam/scam combination.
    elif (
        mute_score >= notify_score
        and mute_score >= digest_score
    ):
        action = Action.MUTE

    # Notify if notification score wins.
    elif notify_score >= digest_score:
        action = Action.NOTIFY

    # Otherwise digest.
    else:
        action = Action.DIGEST

    # ---------------------------------------------------------------
    # Confidence
    # ---------------------------------------------------------------

    confidence_score = compute_confidence(
    urgency_score,
    scam_probability,
    spam_probability,
    business_trust_score,
    features.is_verified_business,
)

    confidence_score = round(
        _clamp01(float(confidence_score)),
        4,
    )

    # ---------------------------------------------------------------
    # Human-readable explanation
    # ---------------------------------------------------------------

    reason = generate_reason(
        action=action,
        urgency_score=urgency_score,
        spam_probability=spam_probability,
        scam_probability=scam_probability,
        business_trust_score=business_trust_score,
        historical_similarity=historical_similarity,
    )

    # ---------------------------------------------------------------
    # Return final result
    # ---------------------------------------------------------------

    return DecisionResult(
        action=action,
        reason=reason,
        confidence_score=confidence_score,
        evidence_message_ids=evidence_message_ids,
        business_trust_score=business_trust_score,
        spam_probability=spam_probability,
        scam_probability=scam_probability,
        urgency_score=urgency_score,
    )