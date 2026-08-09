"""
Voice transcription service (Phase 11).

Transcribes voice notes using OpenAI's Whisper (local, open-source model —
`openai-whisper` package). Whisper downloads its model weights (~140MB for
the `base` size) from OpenAI's CDN on first use — free, no API key, but
needs internet the first time (same one-time-download caveat as Phases 6
and 10). The model is loaded lazily via `get_whisper_model()` so the app
doesn't need it just to boot, and that function is intentionally thin and
swappable so this pipeline is unit-testable without waiting on the real
model download.

Whisper's Python API works on file paths, not raw bytes, so incoming audio
is written to a temp file first (cleaned up in a `finally` block).
"""
from __future__ import annotations

import os
import tempfile
from dataclasses import dataclass
from functools import lru_cache

from app.core.config import get_settings

settings = get_settings()


@lru_cache
def get_whisper_model():
    """Lazily load the Whisper model. Only called the first time
    transcription is actually needed — not at app startup.
    """
    import whisper

    return whisper.load_model(settings.WHISPER_MODEL_SIZE)


@dataclass
class TranscriptionExtraction:
    transcript: str
    language: str
    duration_seconds: float


def transcribe_audio_bytes(audio_bytes: bytes, filename_hint: str = "audio.ogg") -> TranscriptionExtraction:
    """Write audio bytes to a temp file (Whisper/ffmpeg need a real path),
    transcribe it, then always clean up the temp file.
    """
    suffix = os.path.splitext(filename_hint)[1] or ".ogg"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        model = get_whisper_model()
        result = model.transcribe(tmp_path)

        transcript = (result.get("text") or "").strip()
        language = result.get("language", "en")

        # Whisper's result doesn't include duration directly in all versions;
        # derive it from the last segment's end time when available.
        segments = result.get("segments") or []
        duration_seconds = segments[-1]["end"] if segments else 0.0

        return TranscriptionExtraction(
            transcript=transcript,
            language=language,
            duration_seconds=round(float(duration_seconds), 2),
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
