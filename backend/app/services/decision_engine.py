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


@dataclass
class DecisionResult:
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
    )

    return DecisionResult(
        action=action,
        reason=reason,
        confidence_score=confidence_score,
        evidence_message_ids=[],
        business_trust_score=business_trust_score,
        spam_probability=spam_probability,
        scam_probability=scam_probability,
        urgency_score=urgency_score,
    )