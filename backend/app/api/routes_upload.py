"""
Dataset ingestion endpoints.

POST /upload
    Upload a messages CSV and REPLACE the previous dataset.

GET /messages
    List currently ingested messages.

Important behavior:
- Every new CSV upload removes the previous messages.
- Previous predictions are also removed.
- Previous senders are removed.
- The newly uploaded CSV becomes the only active dataset.
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.db_models import Message, Prediction, Sender
from app.models.schemas import MessageOut, UploadResponse
from app.repositories.message_repository import list_messages
from app.services.ingestion_service import ingest_csv_bytes


router = APIRouter(tags=["ingestion"])


@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> UploadResponse:

    # ---------------------------------------------------------
    # 1. Validate file
    # ---------------------------------------------------------
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file was selected.",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only .csv files are supported.",
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    # ---------------------------------------------------------
    # 2. Clear previous dataset
    #
    # IMPORTANT:
    # Predictions must be deleted first because predictions
    # reference messages.
    # ---------------------------------------------------------
    try:
        db.query(Prediction).delete(
            synchronize_session=False
        )

        db.query(Message).delete(
            synchronize_session=False
        )

        db.query(Sender).delete(
            synchronize_session=False
        )

        db.commit()

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear previous dataset: {exc}",
        ) from exc

    # ---------------------------------------------------------
    # 3. Ingest the new CSV
    # ---------------------------------------------------------
    try:
        result = ingest_csv_bytes(
            db,
            file_bytes,
        )

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse CSV: {exc}",
        ) from exc

    # ---------------------------------------------------------
    # 4. Make sure at least one row was inserted
    # ---------------------------------------------------------
    if result.rows_ingested == 0:

        detail = (
            "; ".join(result.skip_reasons[:5])
            or "No valid rows found."
        )

        raise HTTPException(
            status_code=422,
            detail=f"No rows were ingested. {detail}",
        )

    # ---------------------------------------------------------
    # 5. Build response
    # ---------------------------------------------------------
    message = (
        f"Previous dataset cleared. "
        f"Ingested {result.rows_ingested} rows."
    )

    if result.rows_skipped:
        message += (
            f" Skipped {result.rows_skipped} invalid rows."
        )

    return UploadResponse(
        filename=file.filename,
        rows_ingested=result.rows_ingested,
        rows_skipped=result.rows_skipped,
        message=message,
    )


@router.get(
    "/messages",
    response_model=list[MessageOut],
)
def get_messages(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[MessageOut]:

    messages = list_messages(
        db,
        limit=limit,
        offset=offset,
    )

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