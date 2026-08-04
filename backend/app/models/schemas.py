"""
Pydantic request/response schemas.
Keep these in sync with frontend/lib/types.ts — they are the API contract.
"""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


# --- Enums (mirror db_models.py) ---

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


# --- Sender ---

class SenderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    sender_type: SenderType
    trust_score: float
    is_verified_business: bool


# --- Message ---

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


# --- Prediction ---

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
    """Used by POST /predict for a single ad-hoc message."""
    content: str
    sender_name: str
    sender_type: SenderType
    message_type: MessageType = MessageType.TEXT
    group_name: str | None = None
    forward_count: int = 0


class BatchPredictResponse(BaseModel):
    total_processed: int
    predictions: list[PredictionOut]


# --- Analytics ---

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


# --- Media analysis ---

class OCRResult(BaseModel):
    extracted_text: str
    detected_language: str | None = None
    confidence: float


class TranscriptionResult(BaseModel):
    transcript: str
    language: str
    duration_seconds: float


# --- Upload ---

class UploadResponse(BaseModel):
    filename: str
    rows_ingested: int
    message: str
