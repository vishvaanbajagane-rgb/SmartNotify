"""
Historical retrieval — semantic similarity search over past messages.

Used by the decision engine to answer: "has the user seen messages like
this before, and what happened to them?" This powers:
  - `evidence_message_ids` in every prediction (explainability)
  - a personalization nudge: if similar past messages were muted, lean
    toward muting; if they were notified, lean toward notifying.

Implementation notes:
  - Embeddings: Sentence-Transformers `all-MiniLM-L6-v2` (384-dim), loaded
    lazily so the app doesn't need the model just to boot.
  - Index: FAISS `IndexFlatIP` (inner product) over L2-normalized vectors,
    which is equivalent to cosine similarity — simple and exact, plenty
    fast for a hackathon-scale dataset.
  - Persistence: the index + a sidecar JSON id-map are written to
    `settings.FAISS_INDEX_PATH` so the index survives restarts.
"""
from __future__ import annotations

import json
import os
import threading
from dataclasses import dataclass
from functools import lru_cache

import numpy as np

from app.core.config import get_settings

settings = get_settings()

_EMBEDDING_DIM_DEFAULT = 384  # all-MiniLM-L6-v2's output dimension


@lru_cache
def get_embedding_model():
    """Lazily load the Sentence-Transformers model. Only called the first
    time an embedding is actually needed — not at app startup.
    """
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(settings.SENTENCE_TRANSFORMER_MODEL)


def encode_texts(texts: list[str]) -> np.ndarray:
    """Encode a list of strings into L2-normalized embedding vectors."""
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    embeddings = embeddings.astype("float32")
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1e-8
    return embeddings / norms


@dataclass
class SimilarMessage:
    message_id: str
    similarity: float


def _sidecar_path(index_path: str) -> str:
    return index_path + ".idmap.json"


class HistoricalIndex:
    """Wraps a FAISS index + a parallel id map (position -> message_id).

    Thread-safe enough for a single-process demo deployment via a simple lock.
    """

    def __init__(self, index_path: str, dimension: int = _EMBEDDING_DIM_DEFAULT):
        self.index_path = index_path
        self.dimension = dimension
        self._lock = threading.Lock()
        self.id_map: list[str] = []
        self.index = None
        self._load_or_init()

    def _load_or_init(self) -> None:
        import faiss

        sidecar = _sidecar_path(self.index_path)
        if os.path.exists(self.index_path) and os.path.exists(sidecar):
            try:
                self.index = faiss.read_index(self.index_path)
                with open(sidecar, encoding="utf-8") as f:
                    self.id_map = json.load(f)
                self.dimension = self.index.d
                return
            except Exception:  # noqa: BLE001 - corrupt index, fall through to rebuild
                pass

        self.index = faiss.IndexFlatIP(self.dimension)
        self.id_map = []

    def save(self) -> None:
        import faiss

        os.makedirs(os.path.dirname(self.index_path) or ".", exist_ok=True)
        with self._lock:
            faiss.write_index(self.index, self.index_path)
            with open(_sidecar_path(self.index_path), "w", encoding="utf-8") as f:
                json.dump(self.id_map, f)

    def clear(self) -> None:
        import faiss

        with self._lock:
            self.index = faiss.IndexFlatIP(self.dimension)
            self.id_map = []

    def add_batch(self, message_ids: list[str], contents: list[str]) -> None:
        if not message_ids:
            return
        vectors = encode_texts(contents)
        with self._lock:
            self.index.add(vectors)
            self.id_map.extend(message_ids)

    def add(self, message_id: str, content: str) -> None:
        self.add_batch([message_id], [content])

    def search(
        self, content: str, top_k: int = 5, exclude_message_id: str | None = None
    ) -> list[SimilarMessage]:
        if self.index.ntotal == 0:
            return []

        query_vector = encode_texts([content])
        k = min(top_k + 1, self.index.ntotal)  # +1 in case the message itself is in the index
        scores, indices = self.index.search(query_vector, k)

        results: list[SimilarMessage] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self.id_map):
                continue
            candidate_id = self.id_map[idx]
            if exclude_message_id is not None and candidate_id == exclude_message_id:
                continue
            results.append(SimilarMessage(message_id=candidate_id, similarity=float(score)))
            if len(results) >= top_k:
                break
        return results


_index_instance: HistoricalIndex | None = None
_index_lock = threading.Lock()


def get_historical_index() -> HistoricalIndex:
    """Module-level singleton so the (potentially large) FAISS index and
    embedding model are shared across requests instead of reloaded each time.
    """
    global _index_instance
    if _index_instance is None:
        with _index_lock:
            if _index_instance is None:
                _index_instance = HistoricalIndex(settings.FAISS_INDEX_PATH)
    return _index_instance


def rebuild_index_from_messages(messages: list) -> int:
    """Full rebuild from a list of ORM Message objects (id + content).
    Called after a fresh dataset upload, or on demand via the API.
    Returns the number of messages indexed.
    """
    index = get_historical_index()
    index.clear()
    if not messages:
        index.save()
        return 0

    ids = [m.id for m in messages]
    contents = [m.content or "" for m in messages]
    index.add_batch(ids, contents)
    index.save()
    return len(ids)

def retrieve_similar_messages(
    content: str,
    top_k: int = 5,
    exclude_message_id: str | None = None,
) -> list[SimilarMessage]:
    """
    Retrieve messages from the historical FAISS index that are
    semantically similar to the supplied content.

    This is the public helper used by the decision engine.
    """

    if not content or not content.strip():
        return []

    try:
        index = get_historical_index()

        return index.search(
            content=content,
            top_k=top_k,
            exclude_message_id=exclude_message_id,
        )

    except Exception:
        # Historical retrieval must never prevent a prediction
        # from being generated.
        return []