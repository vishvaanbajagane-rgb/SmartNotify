SENDER_ALIASES = [
    "sender",
    "sender_id",
    "sender_user_id",
    "from",
    "from_user",
    "user",
    "user_id",
    "author",
    "author_id",
    "username",
]

CONTENT_ALIASES = [
    "content",
    "message",
    "message_text",
    "message_body",
    "text",
    "body",
    "message_content",
]

TIMESTAMP_ALIASES = [
    "timestamp",
    "created_at",
    "datetime",
    "date",
    "time",
    "sent_at",
]

MESSAGE_TYPE_ALIASES = [
    "message_type",
    "media_type",
    "type",
    "content_type",
]

FORWARD_COUNT_ALIASES = [
    "forward_count",
    "forwarded_count",
    "forwards",
]


def normalize_column_name(name: str) -> str:
    return (
        str(name)
        .strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
    )


def find_column(columns, aliases):
    normalized = {
        normalize_column_name(column): column
        for column in columns
    }

    for alias in aliases:
        if alias in normalized:
            return normalized[alias]

    return None


def detect_columns(columns):
    return {
        "sender": find_column(columns, SENDER_ALIASES),
        "content": find_column(columns, CONTENT_ALIASES),
        "timestamp": find_column(columns, TIMESTAMP_ALIASES),
        "message_type": find_column(columns, MESSAGE_TYPE_ALIASES),
        "forward_count": find_column(columns, FORWARD_COUNT_ALIASES),
    }