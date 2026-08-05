"""
Confidence scoring.

Confidence isn't "how sure are we this is a scam" — it's "how decisive is
the overall signal set". A message with all signals near their midpoint
(ambiguous) gets low confidence even if the final action seems obvious;
a message with clear, strong signals in one direction gets high confidence.
"""
from __future__ import annotations


def _decisiveness(value: float) -> float:
    """0.0 at value=0.5 (maximally ambiguous), 1.0 at value=0.0 or 1.0 (maximally decisive)."""
    return abs(value - 0.5) * 2


def compute_confidence(
    urgency_score: float,
    scam_probability: float,
    spam_probability: float,
    business_trust_score: float,
    is_verified_business: bool,
) -> float:
    signals = [urgency_score, scam_probability, spam_probability, business_trust_score]
    avg_decisiveness = sum(_decisiveness(s) for s in signals) / len(signals)

    confidence = avg_decisiveness

    if is_verified_business:
        confidence = min(1.0, confidence + 0.15)

    confidence = max(0.05, min(1.0, confidence))
    return round(confidence, 4)