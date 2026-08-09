"""
Dataset ingestion service.

Reads messages.csv or similarly-shaped CSV files and loads them into
PostgreSQL as Sender + Message rows.

The ingestion layer is intentionally flexible:

- Column names are matched case-insensitively.
- Spaces and hyphens are normalized to underscores.
- Multiple aliases are supported for sender/content/timestamp/etc.
- Only sender and content are required.
- Optional columns receive sensible defaults.
- Invalid individual rows are skipped instead of failing the whole upload.
- Extra CSV columns are ignored.
"""

from __future__ import annotations

import io
from dataclasses import dataclass, field

import pandas as pd
from sqlalchemy.orm import Session

from app.models.db_models import MessageTypeEnum, SenderTypeEnum
from app.repositories.message_repository import (
    create_message,
    get_or_create_sender,
)


# ============================================================
# COLUMN ALIASES
# ============================================================
#
# Left side = canonical field used by SmartNotify.
#
# Right side = possible column names that may appear in
# different CSV formats.
#
# Examples:
#
#   "Phone Number" -> sender
#   "phone-number" -> sender
#   "phone_number" -> sender
#   "Message"      -> content
#   "msg"          -> content
#   "Body"         -> content
#
# Only "sender" and "content" are required.
#

COLUMN_ALIASES: dict[str, list[str]] = {
    "sender": [
        "sender",
        "sender_name",
        "sender_id",
        "sender_user_id",
        "sender_phone",
        "from",
        "from_user",
        "contact",
        "contact_name",
        "name",
        "author",
        "author_id",
        "phone",
        "phone_number",
        "phone number",
        "number",
        "username",
        "user",
        "user_id",
    ],

    "sender_type": [
        "sender_type",
        "type_of_sender",
        "chat_type",
        "contact_type",
    ],

    "content": [
        "content",
        "message",
        "message_text",
        "message_content",
        "message_body",
        "text",
        "text_content",
        "body",
        "msg",
        "description",
        "sms_body",
    ],

    "message_type": [
        "message_type",
        "msg_type",
        "media_type",
        "content_type",
        "type",
    ],

    "group_name": [
        "group_name",
        "group",
        "chat_name",
        "conversation_name",
    ],

    "media_url": [
        "media_url",
        "media_path",
        "attachment",
        "attachment_url",
        "file_url",
        "file_path",
    ],

    "forward_count": [
        "forward_count",
        "forwarded_count",
        "forwards",
        "forwarded_times",
        "num_forwards",
        "forward",
    ],

    "timestamp": [
        "timestamp",
        "created_at",
        "datetime",
        "date",
        "time",
        "sent_at",
        "date_time",
        "sent_time",
    ],

    "is_verified_business": [
        "is_verified_business",
        "verified",
        "business_verified",
        "verified_business",
    ],
}


# ============================================================
# VALID ENUM VALUES
# ============================================================

VALID_SENDER_TYPES = {item.value for item in SenderTypeEnum}
VALID_MESSAGE_TYPES = {item.value for item in MessageTypeEnum}


# ============================================================
# INGESTION RESULT
# ============================================================

@dataclass
class IngestionResult:
    """
    Result returned after processing a CSV.

    rows_ingested:
        Number of rows successfully inserted.

    rows_skipped:
        Number of rows ignored because required data was missing
        or invalid.

    skip_reasons:
        Human-readable reasons explaining skipped rows or
        structural CSV problems.
    """

    rows_ingested: int = 0
    rows_skipped: int = 0
    skip_reasons: list[str] = field(default_factory=list)


# ============================================================
# COLUMN NORMALIZATION
# ============================================================

def _normalize_column_name(name: str) -> str:
    """
    Normalize a CSV column name before alias matching.

    Examples:

        "Phone Number" -> "phone_number"
        "phone-number" -> "phone_number"
        "PHONE NUMBER" -> "phone_number"
        " Message "    -> "message"
    """

    return (
        str(name)
        .lower()
        .strip()
        .replace(" ", "_")
        .replace("-", "_")
    )


def _build_column_map(columns: list[str]) -> dict[str, str]:
    """
    Build a mapping:

        canonical field -> actual CSV column name

    Example:

        CSV columns:
            ["Phone Number", "Message", "Date"]

        Result:
            {
                "sender": "Phone Number",
                "content": "Message",
                "timestamp": "Date",
            }

    This allows the rest of the ingestion code to work with
    canonical names regardless of how the CSV is formatted.
    """

    normalized_columns: dict[str, str] = {}

    for column in columns:
        normalized = _normalize_column_name(column)
        normalized_columns[normalized] = column

    resolved: dict[str, str] = {}

    for canonical_field, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            normalized_alias = _normalize_column_name(alias)

            if normalized_alias in normalized_columns:
                resolved[canonical_field] = normalized_columns[normalized_alias]
                break

    return resolved


# ============================================================
# VALUE NORMALIZATION
# ============================================================

def _normalize_sender_type(raw: str | None) -> SenderTypeEnum:
    """
    Convert a raw sender type into the application's enum.

    Unknown or missing values default to CONTACT.
    """

    if raw is None:
        return SenderTypeEnum.CONTACT

    value = str(raw).strip().lower()

    if value not in VALID_SENDER_TYPES:
        return SenderTypeEnum.CONTACT

    return SenderTypeEnum(value)


def _normalize_message_type(raw: str | None) -> MessageTypeEnum:
    """
    Convert a raw message type into the application's enum.

    Unknown or missing values default to TEXT.
    """

    if raw is None:
        return MessageTypeEnum.TEXT

    value = str(raw).strip().lower()

    if value not in VALID_MESSAGE_TYPES:
        return MessageTypeEnum.TEXT

    return MessageTypeEnum(value)


def _parse_bool(raw) -> bool:
    """
    Convert common CSV boolean representations into bool.

    Accepted true values:

        1
        true
        yes
        y
        on
    """

    if isinstance(raw, bool):
        return raw

    if raw is None:
        return False

    return str(raw).strip().lower() in {
        "1",
        "true",
        "yes",
        "y",
        "on",
    }


def _parse_int(raw, default: int = 0) -> int:
    """
    Safely convert a value to an integer.

    Invalid values return the supplied default.
    """

    try:
        if raw is None or pd.isna(raw):
            return default

        return int(float(raw))

    except (TypeError, ValueError):
        return default


def _parse_timestamp(raw):
    """
    Convert a CSV timestamp/date value into a Python datetime.

    Invalid or empty timestamps return None.
    """

    if raw is None:
        return None

    try:
        if pd.isna(raw):
            return None
    except (TypeError, ValueError):
        pass

    try:
        timestamp = pd.to_datetime(raw)

        if pd.isna(timestamp):
            return None

        return timestamp.to_pydatetime()

    except (ValueError, TypeError):
        return None


# ============================================================
# DATAFRAME INGESTION
# ============================================================

def ingest_dataframe(
    db: Session,
    df: pd.DataFrame,
) -> IngestionResult:
    """
    Ingest a pandas DataFrame into PostgreSQL.

    Required CSV fields:

        sender
        content

    Everything else is optional.

    Extra columns are ignored.

    Rows with missing sender/content are skipped rather than
    failing the complete upload.
    """

    result = IngestionResult()

    # --------------------------------------------------------
    # Empty CSV
    # --------------------------------------------------------

    if df.empty:
        result.skip_reasons.append(
            "CSV file is empty."
        )
        return result

    # --------------------------------------------------------
    # Resolve CSV columns
    # --------------------------------------------------------

    col_map = _build_column_map(
        list(df.columns)
    )

    # --------------------------------------------------------
    # Required fields
    # --------------------------------------------------------

    missing_required: list[str] = []

    if "sender" not in col_map:
        missing_required.append("sender")

    if "content" not in col_map:
        missing_required.append("content")

    if missing_required:
        result.skip_reasons.append(
            "CSV is missing required columns: "
            + ", ".join(missing_required)
            + ". "
            + f"Detected columns: {list(df.columns)}"
        )

        return result

    # --------------------------------------------------------
    # Process rows
    # --------------------------------------------------------

    for index, row in df.iterrows():

        try:
            # ------------------------------------------------
            # Sender
            # ------------------------------------------------

            sender_raw = row.get(
                col_map["sender"]
            )

            if pd.isna(sender_raw):
                sender_name = ""

            else:
                sender_name = str(
                    sender_raw
                ).strip()

            if not sender_name:
                result.rows_skipped += 1

                result.skip_reasons.append(
                    f"Row {index}: missing sender name."
                )

                continue

            # ------------------------------------------------
            # Content
            # ------------------------------------------------

            content_raw = row.get(
                col_map["content"]
            )

            if pd.isna(content_raw):
                content = ""

            else:
                content = str(
                    content_raw
                ).strip()

            if not content:
                result.rows_skipped += 1

                result.skip_reasons.append(
                    f"Row {index}: missing message content."
                )

                continue

            # ------------------------------------------------
            # Sender type
            # ------------------------------------------------

            sender_type = _normalize_sender_type(
                row.get(
                    col_map["sender_type"]
                )
                if "sender_type" in col_map
                else None
            )

            # ------------------------------------------------
            # Message type
            # ------------------------------------------------

            message_type = _normalize_message_type(
                row.get(
                    col_map["message_type"]
                )
                if "message_type" in col_map
                else None
            )

            # ------------------------------------------------
            # Group name
            # ------------------------------------------------

            group_name = None

            if "group_name" in col_map:
                raw_group = row.get(
                    col_map["group_name"]
                )

                if pd.notna(raw_group):
                    value = str(raw_group).strip()

                    if value:
                        group_name = value

            # ------------------------------------------------
            # Media URL
            # ------------------------------------------------

            media_url = None

            if "media_url" in col_map:
                raw_media = row.get(
                    col_map["media_url"]
                )

                if pd.notna(raw_media):
                    value = str(raw_media).strip()

                    if value:
                        media_url = value

            # ------------------------------------------------
            # Forward count
            # ------------------------------------------------

            forward_count = 0

            if "forward_count" in col_map:
                forward_count = _parse_int(
                    row.get(
                        col_map["forward_count"]
                    )
                )

            # ------------------------------------------------
            # Timestamp
            # ------------------------------------------------

            timestamp = None

            if "timestamp" in col_map:
                timestamp = _parse_timestamp(
                    row.get(
                        col_map["timestamp"]
                    )
                )

            # ------------------------------------------------
            # Verified business
            # ------------------------------------------------

            is_verified_business = False

            if "is_verified_business" in col_map:
                is_verified_business = _parse_bool(
                    row.get(
                        col_map["is_verified_business"]
                    )
                )

            # ------------------------------------------------
            # Get/create sender
            # ------------------------------------------------

            sender = get_or_create_sender(
                db,
                name=sender_name,
                sender_type=sender_type,
                is_verified_business=is_verified_business,
            )

            # ------------------------------------------------
            # Create message
            # ------------------------------------------------

            create_message(
                db,
                sender=sender,
                content=content,
                message_type=message_type,
                group_name=group_name,
                media_url=media_url,
                forward_count=forward_count,
                timestamp=timestamp,
            )

            result.rows_ingested += 1

        except Exception as exc:
            # ------------------------------------------------
            # One bad row should not destroy the entire upload.
            # ------------------------------------------------

            result.rows_skipped += 1

            result.skip_reasons.append(
                f"Row {index}: ingestion error: {exc}"
            )

    # --------------------------------------------------------
    # Commit all successfully processed rows
    # --------------------------------------------------------

    db.commit()

    return result


# ============================================================
# CSV BYTES INGESTION
# ============================================================

def ingest_csv_bytes(
    db: Session,
    file_bytes: bytes,
) -> IngestionResult:
    """
    Parse raw CSV bytes and ingest them.

    Used by the FastAPI upload endpoint.
    """

    if not file_bytes:
        result = IngestionResult()

        result.skip_reasons.append(
            "Uploaded CSV file is empty."
        )

        return result

    try:
        df = pd.read_csv(
            io.BytesIO(file_bytes)
        )

    except Exception as exc:
        result = IngestionResult()

        result.skip_reasons.append(
            f"Unable to read CSV file: {exc}"
        )

        return result

    return ingest_dataframe(
        db,
        df,
    )


# ============================================================
# CSV FILE PATH INGESTION
# ============================================================

def ingest_csv_path(
    db: Session,
    path: str,
) -> IngestionResult:
    """
    Ingest a CSV file already present on disk.

    Used by dataset auto-loading/startup scripts.
    """

    try:
        df = pd.read_csv(path)

    except FileNotFoundError:
        result = IngestionResult()

        result.skip_reasons.append(
            f"CSV file not found: {path}"
        )

        return result

    except Exception as exc:
        result = IngestionResult()

        result.skip_reasons.append(
            f"Unable to read CSV file '{path}': {exc}"
        )

        return result

    return ingest_dataframe(
        db,
        df,
    )