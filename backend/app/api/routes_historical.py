"""
Historical retrieval endpoints (Phase 6).

POST /historical/rebuild-index — rebuild the FAISS index from every message
                                  currently in the database (run after upload)
GET  /historical/similar        — ad-hoc similarity search, for debugging
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.schemas import HistoricalRebuildResponse, SimilarMessageOut
from app.repositories.message_repository import (
    get_message_by_id,
    list_all_messages_with_sender,
)
from app.repositories.prediction_repository import get_predictions_by_message_ids
from app.services.historical_retrieval import get_historical_index, rebuild_index_from_messages

router = APIRouter(tags=["historical"])


@router.post("/historical/rebuild-index", response_model=HistoricalRebuildResponse)
def rebuild_index(db: Session = Depends(get_db)) -> HistoricalRebuildResponse:
    messages = list_all_messages_with_sender(db)
    try:
        count = rebuild_index_from_messages(messages)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail=(
                "Could not build the historical index — the embedding model "
                f"may not be downloaded yet (needs internet on first run). Detail: {exc}"
            ),
        ) from exc

    return HistoricalRebuildResponse(
        messages_indexed=count,
        message=f"Indexed {count} messages for historical similarity search.",
    )


@router.get("/historical/similar", response_model=list[SimilarMessageOut])
def find_similar(
    content: str = Query(..., description="Message text to search for similar past messages"),
    top_k: int = 5,
    db: Session = Depends(get_db),
) -> list[SimilarMessageOut]:
    try:
        index = get_historical_index()
        results = index.search(content, top_k=top_k)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail=f"Historical index unavailable: {exc}",
        ) from exc

    if not results:
        return []

    ids = [r.message_id for r in results]
    messages_by_id = {m.id: m for m in list_all_messages_with_sender(db) if m.id in ids}
    predictions_by_id = {p.message_id: p for p in get_predictions_by_message_ids(db, ids)}

    output = []
    for r in results:
        message = messages_by_id.get(r.message_id)
        prediction = predictions_by_id.get(r.message_id)
        output.append(
            SimilarMessageOut(
                message_id=r.message_id,
                content=message.content if message else "",
                similarity=round(r.similarity, 4),
                past_action=prediction.action.value if prediction else None,
            )
        )
    return output