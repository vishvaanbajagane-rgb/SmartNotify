"""
Data-access layer for senders and messages.
Keeps SQL/ORM logic out of the API route handlers.
"""
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.db_models import Message, MessageTypeEnum, Sender, SenderTypeEnum


def get_or_create_sender(
    db: Session,
    name: str,
    sender_type: SenderTypeEnum,
    is_verified_business: bool = False,
) -> Sender:
    """Look up a sender by name+type, or create it if it doesn't exist yet.

    In a real WhatsApp export, phone numbers would be the unique key rather
    than display name — swap this out once you have that field available.
    """
    stmt = select(Sender).where(Sender.name == name, Sender.sender_type == sender_type)
    existing = db.execute(stmt).scalar_one_or_none()
    if existing:
        return existing

    sender = Sender(
        name=name,
        sender_type=sender_type,
        is_verified_business=is_verified_business,
    )
    db.add(sender)
    db.flush()
    return sender


def create_message(
    db: Session,
    sender: Sender,
    content: str,
    message_type: MessageTypeEnum = MessageTypeEnum.TEXT,
    group_name: str | None = None,
    media_url: str | None = None,
    forward_count: int = 0,
    timestamp: datetime | None = None,
) -> Message:
    message = Message(
        sender_id=sender.id,
        content=content,
        message_type=message_type,
        group_name=group_name,
        media_url=media_url,
        forward_count=forward_count,
        timestamp=timestamp or datetime.utcnow(),
    )
    db.add(message)
    return message


def count_messages(db: Session) -> int:
    return db.query(Message).count()


def list_messages(db: Session, limit: int = 100, offset: int = 0) -> list[Message]:
    stmt = select(Message).order_by(Message.timestamp.desc()).limit(limit).offset(offset)
    return list(db.execute(stmt).scalars().all())

def get_message_by_id(db: Session, message_id: str) -> Message | None:
    stmt = (
        select(Message)
        .options(joinedload(Message.sender))
        .where(Message.id == message_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def list_all_messages_with_sender(db: Session) -> list[Message]:
    """Used by feature engineering / decision engine phases that need every
    message loaded with its sender relationship (e.g. batch prediction)."""
    stmt = select(Message).options(joinedload(Message.sender)).order_by(Message.timestamp.asc())
    return list(db.execute(stmt).scalars().all())