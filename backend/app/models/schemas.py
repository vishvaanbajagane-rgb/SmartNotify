"""
Pydantic request/response schemas.
Keep these in sync with frontend/lib/types.ts — they are the API contract.
"""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class Action(str, Enum):
    NOTIFY = "Notify"
    DIGEST = "Digest"
    MUTE = "Mute"


class SenderType(str, Enum):
    CONTACT = "contact"
    BUSINESS = "business"
    GROUP = "group"


class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VOICE = "voice"


class SenderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    sender_type: SenderType
    trust_score: float
    is_verified_business: bool


class MessageBase(BaseModel):
    content: str
    message_type: MessageType = MessageType.TEXT
    group_name: str | None = None
    media_url: str | None = None
    forward_count: int = 0


class MessageCreate(MessageBase):
    sender_name: str
    sender_type: SenderType


class MessageOut(MessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sender_id: str
    timestamp: datetime


class PredictionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message_id: str = Field(validation_alias="message_id")
    action: Action
    reason: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    evidence_message_ids: list[str] = []
    business_trust_score: float = Field(ge=0.0, le=1.0)
    spam_probability: float = Field(ge=0.0, le=1.0)
    scam_probability: float = Field(ge=0.0, le=1.0)
    urgency_score: float = Field(ge=0.0, le=1.0)


class PredictionRequest(BaseModel):
    content: str
    sender_name: str
    sender_type: SenderType
    message_type: MessageType = MessageType.TEXT
    group_name: str | None = None
    forward_count: int = 0


class BatchPredictResponse(BaseModel):
    total_processed: int
    predictions: list[PredictionOut]


class ActionBreakdown(BaseModel):
    Notify: int
    Digest: int
    Mute: int


class FlaggedSender(BaseModel):
    sender: str
    scam_probability: float


class AnalyticsSummary(BaseModel):
    total_messages: int
    action_breakdown: ActionBreakdown
    avg_confidence: float
    top_flagged_senders: list[FlaggedSender]


class OCRResult(BaseModel):
    extracted_text: str
    detected_language: str | None = None
    confidence: float


class TranscriptionResult(BaseModel):
    transcript: str
    language: str
    duration_seconds: float

class MessageFeaturesOut(BaseModel):
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
    
class UploadResponse(BaseModel):
    filename: str
    rows_ingested: int
    rows_skipped: int
    message: str