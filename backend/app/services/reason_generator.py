"""
Reason generation — turns the numeric signals behind a decision into a
human-readable explanation, the core of this system's explainability.
"""
from __future__ import annotations

from app.models.db_models import ActionEnum
from app.services.feature_engineering import MessageFeatures

ACTION_PREFIX = {
    ActionEnum.NOTIFY: "Notified",
    ActionEnum.DIGEST: "Added to digest",
    ActionEnum.MUTE: "Muted",
}


def generate_reason(
    action: ActionEnum,
    features: MessageFeatures,
    urgency_score: float,
    scam_probability: float,
    spam_probability: float,
    business_trust_score: float,
) -> str:
    clauses: list[str] = []

    if scam_probability >= 0.75:
        clauses.append(
            f"high scam risk ({scam_probability:.0%}) from suspicious keywords "
            f"and forwarding pattern (forwarded {features.forward_count}x)"
        )
    elif scam_probability >= 0.4:
        clauses.append(f"some scam indicators present ({scam_probability:.0%} risk)")

    if features.is_verified_business and business_trust_score >= 0.8:
        clauses.append("sender is a verified, trusted business")
    elif features.is_business_sender and not features.is_verified_business:
        clauses.append("sender is an unverified business account")

    if urgency_score >= 0.5:
        clauses.append(f"message contains urgent language (urgency score {urgency_score:.0%})")

    if spam_probability >= 0.5:
        clauses.append(f"message matches spam patterns ({spam_probability:.0%})")

    if features.is_group_message and action == ActionEnum.DIGEST:
        clauses.append("group messages are digested by default unless urgent")

    if features.forward_count >= 20 and scam_probability < 0.75:
        clauses.append(f"heavily forwarded ({features.forward_count}x), a common spam/scam signal")

    if not clauses:
        clauses.append("no strong urgency, scam, or spam signals detected — routine message")

    prefix = ACTION_PREFIX[action]
    return f"{prefix} because {'; '.join(clauses)}."
    