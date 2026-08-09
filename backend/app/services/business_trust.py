"""
Business trust scoring (Phase 7).

Replaces the flat `sender.trust_score` default used since Phase 5 with a
score computed from the sender's actual history in the database:

  - verification status (is_verified_business) — strongest signal
  - message volume from this sender (more history = more confidence either way)
  - how their past messages were routed (mostly Notify/Digest vs. mostly Mute)
  - average forward count (high = more likely bulk/broadcast, less "trusted 1:1")

Falls back to the sender's static `trust_score` column when there isn't
enough history yet (cold start), so behavior degrades gracefully for brand
new senders instead of guessing wildly.
"""
from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.db_models import ActionEnum, Message, Prediction, Sender

MIN_HISTORY_FOR_LEARNED_SCORE = 3  # below this, trust the static default instead


@dataclass
class BusinessTrustResult:
    trust_score: float
    message_count: int
    mute_rate: float
    notify_rate: float
    basis: str  # "verified" | "learned" | "default"


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def compute_sender_trust(db: Session, sender: Sender) -> BusinessTrustResult:
    """Compute a trust score for a sender using their message + prediction history."""
    if sender.is_verified_business:
        return BusinessTrustResult(
            trust_score=max(0.85, sender.trust_score),
            message_count=0,
            mute_rate=0.0,
            notify_rate=0.0,
            basis="verified",
        )

    stmt = (
        select(Prediction.action, Message.forward_count)
        .join(Message, Message.id == Prediction.message_id)
        .where(Message.sender_id == sender.id)
    )
    rows = db.execute(stmt).all()

    if len(rows) < MIN_HISTORY_FOR_LEARNED_SCORE:
        return BusinessTrustResult(
            trust_score=_clamp01(sender.trust_score),
            message_count=len(rows),
            mute_rate=0.0,
            notify_rate=0.0,
            basis="default",
        )

    total = len(rows)
    mute_count = sum(1 for action, _ in rows if action == ActionEnum.MUTE)
    notify_count = sum(1 for action, _ in rows if action == ActionEnum.NOTIFY)
    mute_rate = mute_count / total
    notify_rate = notify_count / total
    avg_forwards = sum(fc or 0 for _, fc in rows) / total

    # Start from the sender's static prior, then adjust based on observed behavior.
    score = sender.trust_score
    score += notify_rate * 0.3          # mostly-notified senders are trustworthy
    score -= mute_rate * 0.4            # mostly-muted senders are not
    if avg_forwards >= 15:
        score -= 0.15                   # heavy forwarding correlates with bulk/spam senders
    if sender.sender_type.value == "business":
        score -= 0.1                    # unverified businesses start with a small penalty

    return BusinessTrustResult(
        trust_score=_clamp01(score),
        message_count=total,
        mute_rate=round(mute_rate, 4),
        notify_rate=round(notify_rate, 4),
        basis="learned",
    )


def compute_business_trust_score(db: Session | None, sender: Sender | None) -> float:
    """Convenience wrapper used by the decision engine: just the score.

    Falls back to the sender's static default (or 0.5 if no sender at all)
    when `db` isn't provided, keeping decide() usable without a DB session.
    """
    if sender is None:
        return 0.5
    if db is None:
        return _clamp01(0.85 if sender.is_verified_business else sender.trust_score)
    return compute_sender_trust(db, sender).trust_score
