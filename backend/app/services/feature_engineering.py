"""
Feature engineering.

Converts a raw Message (+ its Sender) into a structured, numeric feature set
that every later phase depends on:

  - Phase 5  (Decision Engine)     combines these into the final action
  - Phase 7  (Business Trust)      reuses sender/content features
  - Phase 8  (Spam Detection)      trains on FEATURE_NAMES vectors
  - Phase 9  (Scam Detection)      trains on FEATURE_NAMES vectors
"""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass, fields

from app.models.db_models import Message, MessageTypeEnum, SenderTypeEnum

URGENCY_KEYWORDS = [
    "urgent", "immediately", "asap", "act now", "act fast", "hurry",
    "expires today", "limited time", "last chance", "final notice",
    "respond now", "verify now", "call now", "right away", "final warning",
]

SCAM_INDICATOR_KEYWORDS = [
    "otp", "one time password", "won", "winner", "lottery", "congratulations",
    "claim now", "claim your", "click here", "verify your account",
    "account blocked", "account suspended", "bank account", "prize",
    "free gift", "cash prize", "tax refund", "gift card", "crypto",
    "investment opportunity", "guaranteed return", "wire transfer",
]

SPAM_INDICATOR_KEYWORDS = [
    "buy now", "discount", "offer", "sale", "% off", "subscribe",
    "unsubscribe", "limited stock", "free trial", "promo code",
    "exclusive deal", "act before", "shop now",
]

URL_REGEX = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
PHONE_REGEX = re.compile(r"\b\d{10,13}\b")
CURRENCY_REGEX = re.compile(r"[$₹€£]|(\brs\.?\b)", re.IGNORECASE)

LATE_NIGHT_START_HOUR = 23
LATE_NIGHT_END_HOUR = 6


@dataclass
class MessageFeatures:
    message_id: str

    text_length: int
    word_count: int
    exclamation_count: int
    question_count: int
    caps_ratio: float
    digit_ratio: float

    has_url: bool
    url_count: int
    has_phone_number: bool
    has_currency_symbol: bool

    urgency_keyword_count: int
    scam_keyword_count: int
    spam_keyword_count: int

    sender_type: str
    is_group_message: bool
    is_business_sender: bool
    is_verified_business: bool
    sender_trust_score: float
    forward_count: int

    message_type: str

    hour_of_day: int
    is_late_night: bool

    def to_dict(self) -> dict:
        return asdict(self)


FEATURE_NAMES: list[str] = [
    "text_length", "word_count", "exclamation_count", "question_count",
    "caps_ratio", "digit_ratio", "has_url", "url_count", "has_phone_number",
    "has_currency_symbol", "urgency_keyword_count", "scam_keyword_count",
    "spam_keyword_count", "is_group_message", "is_business_sender",
    "is_verified_business", "sender_trust_score", "forward_count",
    "hour_of_day", "is_late_night",
]


def _count_keyword_hits(text_lower: str, keywords: list[str]) -> int:
    return sum(1 for kw in keywords if kw in text_lower)


def _caps_ratio(text: str) -> float:
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return 0.0
    upper = sum(1 for c in letters if c.isupper())
    return round(upper / len(letters), 4)


def _digit_ratio(text: str) -> float:
    if not text:
        return 0.0
    digits = sum(1 for c in text if c.isdigit())
    return round(digits / len(text), 4)


def extract_features(message: Message) -> MessageFeatures:
    """Extract the full feature set for a single message.

    `message` must have its `sender` relationship loaded (use
    repositories.message_repository.get_message_by_id /
    list_all_messages_with_sender, which eager-load it).
    """
    content = message.content or ""
    content_lower = content.lower()
    sender = message.sender

    hour_of_day = message.timestamp.hour if message.timestamp else 12
    is_late_night = hour_of_day >= LATE_NIGHT_START_HOUR or hour_of_day < LATE_NIGHT_END_HOUR

    sender_type = sender.sender_type.value if sender else SenderTypeEnum.CONTACT.value
    message_type = (
        message.message_type.value if message.message_type else MessageTypeEnum.TEXT.value
    )

    return MessageFeatures(
        message_id=message.id,
        text_length=len(content),
        word_count=len(content.split()),
        exclamation_count=content.count("!"),
        question_count=content.count("?"),
        caps_ratio=_caps_ratio(content),
        digit_ratio=_digit_ratio(content),
        has_url=bool(URL_REGEX.search(content)),
        url_count=len(URL_REGEX.findall(content)),
        has_phone_number=bool(PHONE_REGEX.search(content)),
        has_currency_symbol=bool(CURRENCY_REGEX.search(content)),
        urgency_keyword_count=_count_keyword_hits(content_lower, URGENCY_KEYWORDS),
        scam_keyword_count=_count_keyword_hits(content_lower, SCAM_INDICATOR_KEYWORDS),
        spam_keyword_count=_count_keyword_hits(content_lower, SPAM_INDICATOR_KEYWORDS),
        sender_type=sender_type,
        is_group_message=(sender_type == SenderTypeEnum.GROUP.value) or bool(message.group_name),
        is_business_sender=(sender_type == SenderTypeEnum.BUSINESS.value),
        is_verified_business=bool(sender.is_verified_business) if sender else False,
        sender_trust_score=float(sender.trust_score) if sender else 0.5,
        forward_count=message.forward_count or 0,
        message_type=message_type,
        hour_of_day=hour_of_day,
        is_late_night=is_late_night,
    )


def feature_vector(features: MessageFeatures) -> list[float]:
    """Numeric-only vector, in FEATURE_NAMES order, ready for sklearn."""
    d = features.to_dict()
    vector: list[float] = []
    for name in FEATURE_NAMES:
        value = d[name]
        if isinstance(value, bool):
            vector.append(1.0 if value else 0.0)
        else:
            vector.append(float(value))
    return vector


def extract_features_batch(messages: list[Message]) -> list[MessageFeatures]:
    return [extract_features(m) for m in messages]