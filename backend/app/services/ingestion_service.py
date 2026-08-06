"""
Dataset ingestion service.

Reads the challenge's messages.csv (or any similarly-shaped CSV) and loads it
into Postgres as Sender + Message rows, ready for Phase 4 (feature engineering)
and Phase 5 (the decision engine) to consume.

Designed to be tolerant of real-world messy CSVs:
- Column names are matched case-insensitively against a set of known aliases.
- Missing optional columns fall back to sensible defaults.
- Rows missing required fields (sender, content) are skipped and reported,
  not fatal to the whole upload.
"""
from __future__ import annotations

import io
from dataclasses import dataclass, field

import pandas as pd
from sqlalchemy.orm import Session

from app.models.db_models import MessageTypeEnum, SenderTypeEnum
from app.repositories.message_repository import create_message, get_or_create_sender

COLUMN_ALIASES: dict[str, list[str]] = {
    "sender": ["sender", "sender_name", "from", "contact", "name"],
    "sender_type": ["sender_type", "type_of_sender", "chat_type"],
    "content": ["content", "message", "text", "message_content", "body"],
    "message_type": ["message_type", "msg_type", "media_type"],
    "group_name": ["group_name", "group", "chat_name"],
    "media_url": ["media_url", "media_path", "attachment", "file_url"],
    "forward_count": ["forward_count", "forwards", "forwarded_times"],
    "timestamp": ["timestamp", "date", "datetime", "sent_at"],
    "is_verified_business": ["is_verified_business", "verified", "business_verified"],
}

VALID_SENDER_TYPES = {e.value for e in SenderTypeEnum}
VALID_MESSAGE_TYPES = {e.value for e in MessageTypeEnum}


@dataclass
class IngestionResult:
    rows_ingested: int = 0
    rows_skipped: int = 0
    skip_reasons: list[str] = field(default_factory=list)


def _build_column_map(columns: list[str]) -> dict[str, str]:
    lower_cols = {c.lower().strip(): c for c in columns}
    resolved: dict[str, str] = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in lower_cols:
                resolved[canonical] = lower_cols[alias]
                break
    return resolved


def _normalize_sender_type(raw: str | None) -> SenderTypeEnum:
    if not raw or str(raw).strip().lower() not in VALID_SENDER_TYPES:
        return SenderTypeEnum.CONTACT
    return SenderTypeEnum(str(raw).strip().lower())


def _normalize_message_type(raw: str | None) -> MessageTypeEnum:
    if not raw or str(raw).strip().lower() not in VALID_MESSAGE_TYPES:
        return MessageTypeEnum.TEXT
    return MessageTypeEnum(str(raw).strip().lower())


def _parse_bool(raw) -> bool:
    if isinstance(raw, bool):
        return raw
    return str(raw).strip().lower() in {"1", "true", "yes", "y"}


def _parse_int(raw, default: int = 0) -> int:
    try:
        if pd.isna(raw):
            return default
        return int(raw)
    except (TypeError, ValueError):
        return default


def _parse_timestamp(raw):
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    try:
        ts = pd.to_datetime(raw)
        return ts.to_pydatetime()
    except (ValueError, TypeError):
        return None


def ingest_dataframe(db: Session, df: pd.DataFrame) -> IngestionResult:
    result = IngestionResult()

    if df.empty:
        result.skip_reasons.append("CSV file is empty.")
        return result

    col_map = _build_column_map(list(df.columns))

    if "sender" not in col_map or "content" not in col_map:
        result.skip_reasons.append(
            f"CSV is missing required columns 'sender' and/or 'content'. "
            f"Detected columns: {list(df.columns)}"
        )
        return result

    for idx, row in df.iterrows():
        sender_name = row.get(col_map["sender"])
        content = row.get(col_map.get("content", ""))

        if pd.isna(sender_name) or str(sender_name).strip() == "":
            result.rows_skipped += 1
            result.skip_reasons.append(f"Row {idx}: missing sender name.")
            continue

        if pd.isna(content) or str(content).strip() == "":
            result.rows_skipped += 1
            result.skip_reasons.append(f"Row {idx}: missing message content.")
            continue

        sender_type = _normalize_sender_type(
            row.get(col_map["sender_type"]) if "sender_type" in col_map else None
        )
        message_type = _normalize_message_type(
            row.get(col_map["message_type"]) if "message_type" in col_map else None
        )
        group_name = (
            str(row.get(col_map["group_name"]))
            if "group_name" in col_map and pd.notna(row.get(col_map["group_name"]))
            else None
        )
        media_url = (
            str(row.get(col_map["media_url"]))
            if "media_url" in col_map and pd.notna(row.get(col_map["media_url"]))
            else None
        )
        forward_count = (
            _parse_int(row.get(col_map["forward_count"])) if "forward_count" in col_map else 0
        )
        timestamp = (
            _parse_timestamp(row.get(col_map["timestamp"])) if "timestamp" in col_map else None
        )
        is_verified_business = (
            _parse_bool(row.get(col_map["is_verified_business"]))
            if "is_verified_business" in col_map
            else False
        )

        sender = get_or_create_sender(
            db,
            name=str(sender_name).strip(),
            sender_type=sender_type,
            is_verified_business=is_verified_business,
        )

        create_message(
            db,
            sender=sender,
            content=str(content).strip(),
            message_type=message_type,
            group_name=group_name,
            media_url=media_url,
            forward_count=forward_count,
            timestamp=timestamp,
        )

        result.rows_ingested += 1

    db.commit()
    return result


def ingest_csv_bytes(db: Session, file_bytes: bytes) -> IngestionResult:
    df = pd.read_csv(io.BytesIO(file_bytes))
    return ingest_dataframe(db, df)


def ingest_csv_path(db: Session, path: str) -> IngestionResult:
    df = pd.read_csv(path)
    return ingest_dataframe(db, df)