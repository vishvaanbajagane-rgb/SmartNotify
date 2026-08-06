<<<<<<< HEAD
"""Decision engine — the heart of SmartNotify AI.

Combines Phase 4's extracted features into four interpretable scores
(urgency, scam probability, spam probability, business trust), consults
Phase 6 historical retrieval (FAISS), Phase 7 business trust, Phase 8
spam detection and Phase 9 scam detection, then produces a final routing
decision together with confidence and a human-readable explanation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.models.schemas import Action
from app.services.business_trust import compute_business_trust_score
from app.services.confidence_scoring import compute_confidence_score
from app.services.feature_engineering import (
    MessageFeatures,
    extract_message_features,
)
from app.services.historical_retrieval import retrieve_similar_messages
from app.services.reason_generator import generate_reason
from app.services.scam_detection import predict_scam_probability
from app.services.spam_detection import predict_spam_probability


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def compute_urgency_score(f: MessageFeatures) -> float:
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


def compute_spam_probability(
    f: MessageFeatures,
    ml_spam_probability: float | None = None,
) -> float:
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
        blended = 0.5 * heuristic_score + 0.5 * ml_spam_probability
    else:
        blended = heuristic_score

    if f.is_verified_business:
        blended *= 0.20

    return round(_clamp01(blended), 4)


def compute_scam_probability(
    f: MessageFeatures,
    ml_scam_probability: float | None = None,
) -> float:
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
        blended = 0.5 * heuristic_score + 0.5 * ml_scam_probability
    else:
        blended = heuristic_score

    if f.is_verified_business:
        blended *= 0.20

    return round(_clamp01(blended), 4)
=======
"""
Decision engine — the heart of SmartNotify AI.

Combines Phase 4's extracted features into four interpretable scores
(urgency, scam probability, spam probability, business trust), then applies
a priority-ordered rule set to pick the final action.

NOTE: scam/spam/business-trust scoring here uses transparent keyword+heuristic
scoring so the whole pipeline is testable end-to-end right now. Phases 7-9
replace compute_business_trust_score / compute_spam_probability /
compute_scam_probability with dedicated trained services — decide()'s shape
and rule priority order stay the same. Phase 6 (FAISS) populates
`evidence_message_ids`, left empty here.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.core.config import get_settings
from app.models.db_models import ActionEnum, Message
from app.services.confidence_scoring import compute_confidence
from app.services.feature_engineering import MessageFeatures, extract_features
from app.services.reason_generator import generate_reason

settings = get_settings()
>>>>>>> 204926dd1efabde27bdee1aea546d3850742902e


@dataclass
class DecisionResult:
<<<<<<< HEAD
    action: Action
    confidence: float
    reason: str
    urgency_score: float
    spam_probability: float
    scam_probability: float
    business_trust_score: float
    evidence_message_ids: list[int]

def decide(
    message: Any,
    db: Session | None = None,
) -> DecisionResult:
    """
    Main SmartNotify AI decision pipeline.

    Pipeline

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
    """

    features = extract_message_features(message)

    evidence_message_ids: list[int] = []
    historical_similarity = 0.0

    if db is not None:
        try:
            retrieval = retrieve_similar_messages(
                db=db,
                message=message,
                top_k=5,
            )

            evidence_message_ids = retrieval.evidence_message_ids
            historical_similarity = retrieval.average_similarity

        except Exception:
            evidence_message_ids = []
            historical_similarity = 0.0

    try:
        business_trust = compute_business_trust_score(
            db=db,
            sender=message.sender,
        )
    except Exception:
        business_trust = features.sender_trust_score

    features.sender_trust_score = business_trust

    try:
        ml_spam_probability = predict_spam_probability(
            message.content or ""
        )
    except Exception:
        ml_spam_probability = None

    try:
        ml_scam_probability = predict_scam_probability(
            message.content or ""
        )
    except Exception:
        ml_scam_probability = None

    urgency_score = compute_urgency_score(features)

    spam_probability = compute_spam_probability(
        features,
        ml_spam_probability,
    )

    scam_probability = compute_scam_probability(
        features,
        ml_scam_probability,
    )

    business_trust_score = business_trust

    personalization_bonus = (
        historical_similarity * 0.10
    )

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

    if scam_probability >= 0.75:
        action = Action.MUTE

    elif mute_score >= notify_score and mute_score >= digest_score:
        action = Action.MUTE

    elif notify_score >= digest_score:
        action = Action.NOTIFY

    else:
        action = Action.DIGEST

    confidence = compute_confidence_score(
        action=action,
        urgency_score=urgency_score,
        spam_probability=spam_probability,
        scam_probability=scam_probability,
        business_trust_score=business_trust_score,
        historical_similarity=historical_similarity,
    )

    reason = generate_reason(
        action=action,
        urgency_score=urgency_score,
        spam_probability=spam_probability,
        scam_probability=scam_probability,
        business_trust_score=business_trust_score,
        historical_similarity=historical_similarity,
=======
    action: ActionEnum
    reason: str
    confidence_score: float
    evidence_message_ids: list[str]
    business_trust_score: float
    spam_probability: float
    scam_probability: float
    urgency_score: float


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def compute_urgency_score(f: MessageFeatures) -> float:
    score = 0.0
    score += min(f.urgency_keyword_count, 3) * 0.20
    score += min(f.exclamation_count, 3) * 0.05
    score += f.caps_ratio * 0.15
    if f.is_late_night:
        score += 0.05
    return round(_clamp01(score), 4)


def compute_scam_probability(f: MessageFeatures) -> float:
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
    if f.sender_trust_score < 0.3:
        score += 0.10
    if f.is_verified_business:
        score *= 0.2
    return round(_clamp01(score), 4)


def compute_spam_probability(f: MessageFeatures) -> float:
    score = 0.0
    score += min(f.spam_keyword_count, 4) * 0.15
    if f.forward_count >= 20:
        score += 0.15
    elif f.forward_count >= 5:
        score += 0.08
    if f.is_business_sender and not f.is_verified_business:
        score += 0.10
    if f.is_verified_business:
        score *= 0.3
    return round(_clamp01(score), 4)


def compute_business_trust_score(f: MessageFeatures) -> float:
    score = f.sender_trust_score
    if f.is_verified_business:
        score = max(score, 0.85)
    return round(_clamp01(score), 4)


def decide(message: Message) -> DecisionResult:
    features = extract_features(message)

    urgency_score = compute_urgency_score(features)
    scam_probability = compute_scam_probability(features)
    spam_probability = compute_spam_probability(features)
    business_trust_score = compute_business_trust_score(features)

    confidence_score = compute_confidence(
        urgency_score, scam_probability, spam_probability,
        business_trust_score, features.is_verified_business,
    )

    if scam_probability >= settings.SCAM_BLOCK_THRESHOLD:
        action = ActionEnum.MUTE
    elif features.is_verified_business and business_trust_score >= 0.8:
        action = ActionEnum.NOTIFY
    elif urgency_score >= 0.5 and scam_probability < 0.4:
        action = ActionEnum.NOTIFY
    elif spam_probability >= 0.5:
        action = ActionEnum.MUTE
    elif features.is_group_message:
        action = ActionEnum.DIGEST
    elif confidence_score >= settings.NOTIFY_CONFIDENCE_THRESHOLD and urgency_score > 0.2:
        action = ActionEnum.NOTIFY
    else:
        action = ActionEnum.DIGEST

    reason = generate_reason(
        action, features, urgency_score, scam_probability, spam_probability, business_trust_score
>>>>>>> 204926dd1efabde27bdee1aea546d3850742902e
    )

    return DecisionResult(
        action=action,
<<<<<<< HEAD
        confidence=confidence,
        reason=reason,
        urgency_score=urgency_score,
        spam_probability=spam_probability,
        scam_probability=scam_probability,
        business_trust_score=business_trust_score,
        evidence_message_ids=evidence_message_ids,
=======
        reason=reason,
        confidence_score=confidence_score,
        evidence_message_ids=[],
        business_trust_score=business_trust_score,
        spam_probability=spam_probability,
        scam_probability=scam_probability,
        urgency_score=urgency_score,
>>>>>>> 204926dd1efabde27bdee1aea546d3850742902e
    )