"""
Decision engine — the heart of SmartNotify AI.

Combines Phase 4's extracted features into four interpretable scores
(urgency, scam probability, spam probability, business trust), consults
Phase 6's historical retrieval for similar past messages, then applies a
priority-ordered rule set to pick the final action.

NOTE on scam/spam/business-trust scoring: this phase uses transparent,
keyword+heuristic scoring so the whole pipeline is testable end-to-end right
now. Phases 7-9 replace compute_business_trust_score / compute_spam_probability
/ compute_scam_probability with dedicated, trained services (scikit-learn
classifiers, sender history stats) — the decide() function's shape and the
rule priority order stay the same, so nothing downstream breaks.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.db_models import ActionEnum, Message
from app.repositories.prediction_repository import get_predictions_by_message_ids
from app.services.business_trust import compute_business_trust_score
from app.services.confidence_scoring import compute_confidence
from app.services.feature_engineering import MessageFeatures, extract_features
from app.services.historical_retrieval import HistoricalIndex, get_historical_index
from app.services.reason_generator import generate_reason
from app.services.scam_detection import predict_scam_probability
from app.services.spam_detection import predict_spam_probability

settings = get_settings()
logger = logging.getLogger(__name__)


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
    score += min(f.urgency_keyword_count, 3) * 0.20   # up to 0.60
    score += min(f.exclamation_count, 3) * 0.05        # up to 0.15
    score += f.caps_ratio * 0.15
    if f.is_late_night:
        score += 0.05
    return round(_clamp01(score), 4)


def compute_scam_probability(f: MessageFeatures, ml_scam_probability: float | None = None) -> float:
    score = 0.0
    score += min(f.scam_keyword_count, 4) * 0.15       # up to 0.60
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
    heuristic_score = _clamp01(score)

    if ml_scam_probability is not None:
        # Blend the trained classifier (Phase 9) with the heuristic signal.
        blended = 0.5 * heuristic_score + 0.5 * ml_scam_probability
    else:
        blended = heuristic_score

    if f.is_verified_business:
        blended *= 0.2  # verified businesses are very unlikely to be scams

    return round(_clamp01(blended), 4)


def compute_spam_probability(f: MessageFeatures, ml_spam_probability: float | None = None) -> float:
    score = 0.0
    score += min(f.spam_keyword_count, 4) * 0.15
    if f.forward_count >= 20:
        score += 0.15
    elif f.forward_count >= 5:
        score += 0.08
    if f.is_business_sender and not f.is_verified_business:
        score += 0.10
    heuristic_score = _clamp01(score)

    if ml_spam_probability is not None:
        # Blend the trained classifier (Phase 8) with the heuristic signal.
        blended = 0.5 * heuristic_score + 0.5 * ml_spam_probability
    else:
        blended = heuristic_score

    if f.is_verified_business:
        blended *= 0.3

    return round(_clamp01(blended), 4)


def _apply_historical_signal(
    message: Message,
    db: Session | None,
    historical_index: HistoricalIndex | None,
    scam_probability: float,
    urgency_score: float,
) -> tuple[float, float, list[str], str | None]:
    """Look up similar past messages and nudge scam/urgency scores based on
    how they were previously routed. Fails silently (returns inputs
    unchanged) if the embedding model or index isn't available — historical
    retrieval is an enhancement, never a hard dependency for the pipeline.
    """
    if db is None:
        return scam_probability, urgency_score, [], None

    try:
        index = historical_index or get_historical_index()
        similar = index.search(message.content or "", top_k=5, exclude_message_id=message.id)
        similar = [s for s in similar if s.similarity >= 0.55]
        if not similar:
            return scam_probability, urgency_score, [], None

        evidence_ids = [s.message_id for s in similar]
        past_predictions = get_predictions_by_message_ids(db, evidence_ids)
        if not past_predictions:
            return scam_probability, urgency_score, evidence_ids, None

        total = len(past_predictions)
        mute_fraction = sum(1 for p in past_predictions if p.action == ActionEnum.MUTE) / total
        notify_fraction = sum(1 for p in past_predictions if p.action == ActionEnum.NOTIFY) / total

        adjusted_scam = _clamp01(scam_probability + mute_fraction * 0.15)
        adjusted_urgency = _clamp01(urgency_score + notify_fraction * 0.10)

        dominant_action = max(
            (ActionEnum.MUTE, mute_fraction), (ActionEnum.NOTIFY, notify_fraction),
            key=lambda pair: pair[1],
        )
        summary = None
        if dominant_action[1] >= 0.5:
            summary = (
                f"{total} similar past message(s) found, "
                f"{dominant_action[1]:.0%} of which were {dominant_action[0].value.lower()}d"
            )

        return adjusted_scam, adjusted_urgency, evidence_ids, summary

    except Exception as exc:  # noqa: BLE001
        # Embedding model unavailable (e.g. no internet on first run) or
        # index corrupt — degrade gracefully rather than failing prediction.
        logger.warning("Historical retrieval unavailable, skipping: %s", exc)
        return scam_probability, urgency_score, [], None


def decide(
    message: Message,
    db: Session | None = None,
    historical_index: HistoricalIndex | None = None,
) -> DecisionResult:
    """Run the full pipeline for one message: features -> scores -> historical
    context -> action -> reason.

    Pass `db` (and optionally a pre-loaded `historical_index`) to enable
    Phase 6 historical retrieval. Omitting `db` skips it gracefully — useful
    for unit tests that don't need a database.
    """
    features = extract_features(message)

    urgency_score = compute_urgency_score(features)
    try:
        ml_spam_probability = predict_spam_probability(message.content or "")
    except Exception:  # noqa: BLE001 - never let a model hiccup break prediction
        ml_spam_probability = None
    try:
        ml_scam_probability = predict_scam_probability(message.content or "")
    except Exception:  # noqa: BLE001
        ml_scam_probability = None
    scam_probability = compute_scam_probability(features, ml_scam_probability)
    spam_probability = compute_spam_probability(features, ml_spam_probability)
    business_trust_score = compute_business_trust_score(db, message.sender)

    scam_probability, urgency_score, evidence_message_ids, historical_summary = (
        _apply_historical_signal(message, db, historical_index, scam_probability, urgency_score)
    )

    confidence_score = compute_confidence(
        urgency_score, scam_probability, spam_probability,
        business_trust_score, features.is_verified_business,
    )

    # --- Priority-ordered decision rules ---
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
        action, features, urgency_score, scam_probability, spam_probability,
        business_trust_score, historical_summary=historical_summary,
    )

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
