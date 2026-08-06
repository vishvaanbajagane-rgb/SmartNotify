"""
ORM models. These map 1:1 conceptually to the frontend TypeScript types
in frontend/lib/types.ts — keep them in sync.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class ActionEnum(str, enum.Enum):
    NOTIFY = "Notify"
    DIGEST = "Digest"
    MUTE = "Mute"


class SenderTypeEnum(str, enum.Enum):
    CONTACT = "contact"
    BUSINESS = "business"
    GROUP = "group"


class MessageTypeEnum(str, enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    VOICE = "voice"

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Sender(Base):
    """A contact, business, or group that sends messages."""
    __tablename__ = "senders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, index=True)
    sender_type: Mapped[SenderTypeEnum] = mapped_column(Enum(SenderTypeEnum))

    # Trust / behavior signals, updated as the system learns
    trust_score: Mapped[float] = mapped_column(Float, default=0.5)  # 0-1
    forward_count_avg: Mapped[float] = mapped_column(Float, default=0.0)
    is_verified_business: Mapped[bool] = mapped_column(Boolean, default=False)

    messages: Mapped[list["Message"]] = relationship(back_populates="sender")
    interactions: Mapped[list["InteractionHistory"]] = relationship(back_populates="sender")


class Message(Base):
    """A single incoming WhatsApp message (text, image, or voice)."""
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    sender_id: Mapped[str] = mapped_column(ForeignKey("senders.id"))
    content: Mapped[str] = mapped_column(Text)  # raw text, or OCR/transcript text for media
    message_type: Mapped[MessageTypeEnum] = mapped_column(Enum(MessageTypeEnum), default=MessageTypeEnum.TEXT)
    group_name: Mapped[str | None] = mapped_column(String, nullable=True)
    media_url: Mapped[str | None] = mapped_column(String, nullable=True)
    forward_count: Mapped[int] = mapped_column(Integer, default=0)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    sender: Mapped["Sender"] = relationship(back_populates="messages")
    prediction: Mapped["Prediction | None"] = relationship(back_populates="message", uselist=False)


class Prediction(Base):
    """The AI's routing decision for a given message, with full explainability."""
    __tablename__ = "predictions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    message_id: Mapped[str] = mapped_column(ForeignKey("messages.id"), unique=True)

    action: Mapped[ActionEnum] = mapped_column(Enum(ActionEnum))
    reason: Mapped[str] = mapped_column(Text)
    confidence_score: Mapped[float] = mapped_column(Float)  # 0-1

    # Evidence: comma-separated message IDs that influenced this decision
    # (kept simple/portable; can move to a join table later if needed)
    evidence_message_ids: Mapped[str] = mapped_column(Text, default="")

    business_trust_score: Mapped[float] = mapped_column(Float, default=0.0)
    spam_probability: Mapped[float] = mapped_column(Float, default=0.0)
    scam_probability: Mapped[float] = mapped_column(Float, default=0.0)
    urgency_score: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    message: Mapped["Message"] = relationship(back_populates="prediction")

    @property
    def evidence_ids_list(self) -> list[str]:
        return [e for e in self.evidence_message_ids.split(",") if e]


class UserPreference(Base):
    """Personalization settings for the (single, demo) user."""
    __tablename__ = "user_preferences"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_label: Mapped[str] = mapped_column(String, default="demo_user")

    # Simple tunable preferences, expandable later
    mute_groups_by_default: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_verified_businesses: Mapped[bool] = mapped_column(Boolean, default=True)
    digest_low_urgency: Mapped[bool] = mapped_column(Boolean, default=True)


class InteractionHistory(Base):
    """Tracks how the user has historically responded to a sender's messages.

    Used by the historical retrieval service (Sentence-Transformers + FAISS)
    to find similar past messages and how they were treated.
    """
    __tablename__ = "interaction_history"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    sender_id: Mapped[str] = mapped_column(ForeignKey("senders.id"))
    message_content: Mapped[str] = mapped_column(Text)
    embedding_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # FAISS vector index position
    past_action: Mapped[ActionEnum] = mapped_column(Enum(ActionEnum))
    was_opened: Mapped[bool] = mapped_column(Boolean, default=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    sender: Mapped["Sender"] = relationship(back_populates="interactions")
