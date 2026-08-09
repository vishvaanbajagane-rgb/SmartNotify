"""
Regression tests for the decision engine's scoring functions (Phase 5).

These test the pure scoring logic directly against MessageFeatures, without
needing a database — fast, deterministic, and the first line of defense
against accidentally changing scoring behavior while tuning thresholds
(Phase 15's whole point).
"""
from app.services.decision_engine import (
    compute_business_trust_score,
    compute_scam_probability,
    compute_spam_probability,
    compute_urgency_score,
)
from app.services.feature_engineering import MessageFeatures


def make_features(**overrides) -> MessageFeatures:
    """Build a MessageFeatures with sensible defaults, overriding just what
    a given test cares about."""
    defaults = dict(
        message_id="test-msg",
        text_length=20,
        word_count=4,
        exclamation_count=0,
        question_count=0,
        caps_ratio=0.0,
        digit_ratio=0.0,
        has_url=False,
        url_count=0,
        has_phone_number=False,
        has_currency_symbol=False,
        urgency_keyword_count=0,
        scam_keyword_count=0,
        spam_keyword_count=0,
        sender_type="contact",
        is_group_message=False,
        is_business_sender=False,
        is_verified_business=False,
        sender_trust_score=0.5,
        forward_count=0,
        message_type="text",
        hour_of_day=12,
        is_late_night=False,
    )
    defaults.update(overrides)
    return MessageFeatures(**defaults)


class TestUrgencyScore:
    def test_no_signals_scores_low(self):
        f = make_features()
        assert compute_urgency_score(f) < 0.1

    def test_urgency_keywords_raise_score(self):
        f = make_features(urgency_keyword_count=3, exclamation_count=2, caps_ratio=0.5)
        assert compute_urgency_score(f) > 0.5

    def test_score_never_exceeds_one(self):
        f = make_features(urgency_keyword_count=10, exclamation_count=10, caps_ratio=1.0, is_late_night=True)
        assert compute_urgency_score(f) <= 1.0


class TestScamProbability:
    def test_no_signals_scores_low(self):
        f = make_features()
        assert compute_scam_probability(f) < 0.1

    def test_scam_keywords_and_forwards_raise_score(self):
        f = make_features(scam_keyword_count=3, forward_count=25, has_url=True, sender_trust_score=0.1)
        assert compute_scam_probability(f) > 0.6

    def test_verified_business_heavily_suppresses_scam_score(self):
        risky = make_features(scam_keyword_count=3, forward_count=25, is_verified_business=False)
        verified = make_features(scam_keyword_count=3, forward_count=25, is_verified_business=True)
        assert compute_scam_probability(verified) < compute_scam_probability(risky)

    def test_ml_blend_moves_score_toward_ml_prediction(self):
        f = make_features(scam_keyword_count=0)
        heuristic_only = compute_scam_probability(f, ml_scam_probability=None)
        blended_high = compute_scam_probability(f, ml_scam_probability=0.95)
        assert blended_high > heuristic_only


class TestSpamProbability:
    def test_no_signals_scores_low(self):
        f = make_features()
        assert compute_spam_probability(f) < 0.1

    def test_unverified_business_scores_higher_than_verified(self):
        unverified = make_features(is_business_sender=True, is_verified_business=False, spam_keyword_count=2)
        verified = make_features(is_business_sender=True, is_verified_business=True, spam_keyword_count=2)
        assert compute_spam_probability(unverified) > compute_spam_probability(verified)


class TestBusinessTrustScore:
    def test_no_db_no_sender_returns_neutral_default(self):
        assert compute_business_trust_score(None, None) == 0.5

    def test_no_db_verified_sender_returns_high_trust(self):
        class FakeSender:
            is_verified_business = True
            trust_score = 0.5

        score = compute_business_trust_score(None, FakeSender())
        assert score >= 0.85

    def test_no_db_unverified_sender_returns_static_default(self):
        class FakeSender:
            is_verified_business = False
            trust_score = 0.4

        score = compute_business_trust_score(None, FakeSender())
        assert score == 0.4
