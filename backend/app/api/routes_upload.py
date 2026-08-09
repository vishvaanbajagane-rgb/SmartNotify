"""
Dataset ingestion endpoints.

POST /upload         — upload a messages CSV (multipart/form-data), ingest it
GET  /messages        — list ingested messages (paginated), useful for
                         verifying an upload worked before moving to Phase 4
"""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.schemas import MessageOut, UploadResponse
from app.repositories.message_repository import list_messages
from app.services.ingestion_service import ingest_csv_bytes

router = APIRouter(tags=["ingestion"])


@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> UploadResponse:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = ingest_csv_bytes(db, file_bytes)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {exc}") from exc

    if result.rows_ingested == 0:
        detail = "; ".join(result.skip_reasons[:5]) or "No valid rows found."
        raise HTTPException(status_code=422, detail=f"No rows were ingested. {detail}")

    message = f"Ingested {result.rows_ingested} rows."
    if result.rows_skipped:
        message += f" Skipped {result.rows_skipped} invalid rows."

    return UploadResponse(
        filename=file.filename,
        rows_ingested=result.rows_ingested,
        rows_skipped=result.rows_skipped,
        message=message,
    )


@router.get("/messages", response_model=list[MessageOut])
def get_messages(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[MessageOut]:
    messages = list_messages(db, limit=limit, offset=offset)
    return [
        MessageOut(
            id=m.id,
            sender_id=m.sender_id,
            sender_name=m.sender.name,
            sender_type=m.sender.sender_type.value,
            content=m.content,
            message_type=m.message_type.value,
            group_name=m.group_name,
            media_url=m.media_url,
            forward_count=m.forward_count,
            timestamp=m.timestamp,
        )
        for m in messages
    ]
