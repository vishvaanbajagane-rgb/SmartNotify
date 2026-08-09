"""
Threshold evaluation harness (Phase 15).

Run this whenever you're tuning `NOTIFY_CONFIDENCE_THRESHOLD` or
`SCAM_BLOCK_THRESHOLD` in config.py. It runs a hand-labeled evaluation set
(including the exact boundary cases flagged as honest limitations back in
Phase 5 — e.g. the bank-impersonation message that scored 35-48% scam risk
and landed in Digest instead of Mute) through the decision engine's scoring
functions across a grid of candidate thresholds, and reports accuracy so you
can pick a value backed by evidence instead of a guess.

Usage:
    cd backend
    python scripts/evaluate_thresholds.py

Grow EVAL_SET as real judge/user feedback comes in — this script's value is
proportional to how representative that set is.
"""
import os
import sys
from dataclasses import dataclass
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.db_models import MessageTypeEnum, SenderTypeEnum
from app.services.decision_engine import (
    compute_business_trust_score,
    compute_scam_probability,
    compute_spam_probability,
    compute_urgency_score,
)
from app.services.feature_engineering import extract_features
from app.services.scam_detection import predict_scam_probability
from app.services.spam_detection import predict_spam_probability


@dataclass
class FakeSender:
    sender_type: SenderTypeEnum
    is_verified_business: bool = False
    trust_score: float = 0.5


@dataclass
class FakeMessage:
    id: str
    content: str
    sender: FakeSender
    forward_count: int = 0
    group_name: str | None = None
    message_type: MessageTypeEnum = MessageTypeEnum.TEXT
    timestamp: datetime = None  # type: ignore[assignment]

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


# --- Hand-labeled evaluation set ---
# Includes the boundary cases flagged as honest limitations in earlier phases.
EVAL_SET: list[dict] = [
    {
        "label": "OTP from verified bank",
        "message": FakeMessage(
            id="1", content="Your OTP for transaction is 482910. Do not share this with anyone.",
            sender=FakeSender(SenderTypeEnum.BUSINESS, is_verified_business=True),
        ),
        "expected": "Notify",
    },
    {
        "label": "Lottery scam, heavily forwarded",
        "message": FakeMessage(
            id="2", content="Congratulations! You have won a lottery of $10000. Click here to claim now",
            sender=FakeSender(SenderTypeEnum.CONTACT), forward_count=45,
        ),
        "expected": "Mute",
    },
    {
        "label": "Bank impersonation (known boundary case from Phase 5)",
        "message": FakeMessage(
            id="3", content="URGENT! Your bank account will be blocked. Verify immediately at this link",
            sender=FakeSender(SenderTypeEnum.CONTACT), forward_count=60,
        ),
        "expected": "Mute",  # what it SHOULD be; Phase 5 showed it landing in Digest
    },
    {
        "label": "Casual chat from a friend",
        "message": FakeMessage(
            id="4", content="Hey are we still on for lunch tomorrow?",
            sender=FakeSender(SenderTypeEnum.CONTACT),
        ),
        "expected": "Digest",
    },
    {
        "label": "Group reminder",
        "message": FakeMessage(
            id="5", content="Reminder: Sprint planning meeting at 3 PM today",
            sender=FakeSender(SenderTypeEnum.GROUP), group_name="Office Team", forward_count=1,
        ),
        "expected": "Digest",
    },
    {
        "label": "Delivery notice, verified business",
        "message": FakeMessage(
            id="6", content="Your order #4521 has been delivered. Enjoy your meal!",
            sender=FakeSender(SenderTypeEnum.BUSINESS, is_verified_business=True),
        ),
        "expected": "Notify",
    },
]


def decide_with_thresholds(message: FakeMessage, notify_threshold: float, scam_threshold: float) -> str:
    """Mirrors decision_engine.decide()'s rule ordering, but takes threshold
    values as parameters instead of reading them from settings — this is
    what makes sweeping candidate values possible.
    """
    features = extract_features(message)  # type: ignore[arg-type]

    ml_spam = predict_spam_probability(message.content)
    ml_scam = predict_scam_probability(message.content)

    urgency_score = compute_urgency_score(features)
    scam_probability = compute_scam_probability(features, ml_scam)
    spam_probability = compute_spam_probability(features, ml_spam)
    business_trust_score = compute_business_trust_score(None, message.sender)  # type: ignore[arg-type]

    if scam_probability >= scam_threshold:
        return "Mute"
    if features.is_verified_business and business_trust_score >= 0.8:
        return "Notify"
    if urgency_score >= 0.5 and scam_probability < 0.4:
        return "Notify"
    if spam_probability >= 0.5:
        return "Mute"
    if features.is_group_message:
        return "Digest"

    confidence_proxy = (urgency_score + (1 - scam_probability) + (1 - spam_probability)) / 3
    if confidence_proxy >= notify_threshold and urgency_score > 0.2:
        return "Notify"
    return "Digest"


def evaluate(notify_threshold: float, scam_threshold: float) -> dict:
    correct = 0
    results = []
    for case in EVAL_SET:
        predicted = decide_with_thresholds(case["message"], notify_threshold, scam_threshold)
        is_correct = predicted == case["expected"]
        correct += is_correct
        results.append((case["label"], case["expected"], predicted, is_correct))
    accuracy = correct / len(EVAL_SET)
    return {"accuracy": accuracy, "results": results}


def main() -> None:
    print(f"Evaluating {len(EVAL_SET)} labeled cases across candidate thresholds\n")

    candidates = [
        (0.65, 0.75),  # current defaults
        (0.60, 0.55),  # lower scam threshold — catches the boundary case
        (0.55, 0.50),
        (0.50, 0.45),
    ]

    best = None
    for notify_t, scam_t in candidates:
        result = evaluate(notify_t, scam_t)
        marker = ""
        if best is None or result["accuracy"] > best[0]:
            best = (result["accuracy"], notify_t, scam_t)
        print(f"NOTIFY_CONFIDENCE_THRESHOLD={notify_t}  SCAM_BLOCK_THRESHOLD={scam_t}"
              f"  ->  accuracy={result['accuracy']:.0%}")

    print(f"\nBest so far: NOTIFY_CONFIDENCE_THRESHOLD={best[1]}, "
          f"SCAM_BLOCK_THRESHOLD={best[2]} ({best[0]:.0%} accuracy)\n")

    print("Detail at current config.py defaults (0.65 / 0.75):")
    for label, expected, predicted, is_correct in evaluate(0.65, 0.75)["results"]:
        mark = "PASS" if is_correct else "FAIL"
        print(f"  [{mark}] {label}: expected={expected}, got={predicted}")


if __name__ == "__main__":
    main()
