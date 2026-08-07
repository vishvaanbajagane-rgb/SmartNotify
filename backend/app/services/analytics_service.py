"""
Analytics service (Phase 12).

Aggregates data already produced by Phases 3-11 into dashboard-ready
summary statistics: action breakdown, message type breakdown, average
confidence/risk scores, top flagged senders, and a daily trend line.
No new ML here — this is a read-model over what's already stored.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.db_models import ActionEnum, Message, MessageTypeEnum, Prediction, Sender


@dataclass
class AnalyticsResult:
    total_messages: int
    action_counts: dict[str, int]
    message_type_counts: dict[str, int]
    avg_confidence: float
    avg_scam_probability: float
    avg_spam_probability: float
    top_flagged_senders: list[tuple[str, float]]
    daily_action_counts: list[dict] = field(default_factory=list)


def _zero_action_counts() -> dict[str, int]:
    return {a.value: 0 for a in ActionEnum}


def _zero_message_type_counts() -> dict[str, int]:
    return {t.value: 0 for t in MessageTypeEnum}


def compute_analytics(db: Session, top_flagged_limit: int = 5) -> AnalyticsResult:
    total_messages = db.execute(select(func.count(Message.id))).scalar_one()

    action_rows = db.execute(
        select(Prediction.action, func.count(Prediction.id)).group_by(Prediction.action)
    ).all()
    action_counts = _zero_action_counts()
    for action, count in action_rows:
        action_counts[action.value] = count

    type_rows = db.execute(
        select(Message.message_type, func.count(Message.id)).group_by(Message.message_type)
    ).all()
    message_type_counts = _zero_message_type_counts()
    for message_type, count in type_rows:
        message_type_counts[message_type.value] = count

    avg_row = db.execute(
        select(
            func.avg(Prediction.confidence_score),
            func.avg(Prediction.scam_probability),
            func.avg(Prediction.spam_probability),
        )
    ).one()
    avg_confidence = round(float(avg_row[0]), 4) if avg_row[0] is not None else 0.0
    avg_scam_probability = round(float(avg_row[1]), 4) if avg_row[1] is not None else 0.0
    avg_spam_probability = round(float(avg_row[2]), 4) if avg_row[2] is not None else 0.0

    flagged_rows = db.execute(
        select(Sender.name, func.avg(Prediction.scam_probability).label("avg_scam"))
        .join(Message, Message.sender_id == Sender.id)
        .join(Prediction, Prediction.message_id == Message.id)
        .group_by(Sender.id, Sender.name)
        .order_by(func.avg(Prediction.scam_probability).desc())
        .limit(top_flagged_limit)
    ).all()
    top_flagged_senders = [(name, round(float(avg_scam), 4)) for name, avg_scam in flagged_rows]

    daily_rows = db.execute(
        select(Message.timestamp, Prediction.action)
        .join(Prediction, Prediction.message_id == Message.id)
    ).all()
    daily_map: dict[str, dict[str, int]] = defaultdict(_zero_action_counts)
    for timestamp, action in daily_rows:
        date_key = timestamp.strftime("%Y-%m-%d") if timestamp else "unknown"
        daily_map[date_key][action.value] += 1

    daily_action_counts = [
        {"date": date_key, **counts} for date_key, counts in sorted(daily_map.items())
    ]

    return AnalyticsResult(
        total_messages=total_messages,
        action_counts=action_counts,
        message_type_counts=message_type_counts,
        avg_confidence=avg_confidence,
        avg_scam_probability=avg_scam_probability,
        avg_spam_probability=avg_spam_probability,
        top_flagged_senders=top_flagged_senders,
        daily_action_counts=daily_action_counts,
    )