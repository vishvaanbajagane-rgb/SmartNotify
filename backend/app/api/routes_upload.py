"""
Dataset ingestion endpoints.

POST /upload
    Upload a messages CSV. Before importing the new dataset, all previous
    messages, senders, and predictions are removed so the application always
    works with ONE active dataset.

GET /messages
    List ingested messages.
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.db_models import Message, Prediction, Sender
from app.models.schemas import MessageOut, UploadResponse
from app.repositories.message_repository import list_messages
from app.services.ingestion_service import ingest_csv_bytes


router = APIRouter(tags=["ingestion"])


def clear_previous_dataset(db: Session) -> None:
    """
    Remove the previous dataset completely.

    Deletion order matters because predictions reference messages,
    and messages reference senders.

    Order:
        1. Predictions
        2. Messages
        3. Senders
    """

    # Delete predictions first because they reference messages.
    db.query(Prediction).delete(synchronize_session=False)

    # Delete messages next because they reference senders.
    db.query(Message).delete(synchronize_session=False)

    # Delete senders last.
    db.query(Sender).delete(synchronize_session=False)

    # Keep the changes inside the current transaction.
    db.flush()


@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """
    Upload a new CSV dataset.

    Every upload replaces the previous dataset.
    """

    # ---------------------------------------------------------
    # 1. Validate filename
    # ---------------------------------------------------------

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only .csv files are supported.",
        )

    # ---------------------------------------------------------
    # 2. Read uploaded file
    # ---------------------------------------------------------

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    # ---------------------------------------------------------
    # 3. Start replacement transaction
    # ---------------------------------------------------------

    try:
        # IMPORTANT:
        # Remove the previous dataset before inserting the new one.
        clear_previous_dataset(db)

        # -----------------------------------------------------
        # 4. Ingest the new CSV
        # -----------------------------------------------------

        result = ingest_csv_bytes(db, file_bytes)

        # -----------------------------------------------------
        # 5. Make sure at least one valid row was imported
        # -----------------------------------------------------

        if result.rows_ingested == 0:
            # Roll back the deletion as well.
            db.rollback()

            detail = (
                "; ".join(result.skip_reasons[:5])
                or "No valid rows found."
            )

            raise HTTPException(
                status_code=422,
                detail=f"No rows were ingested. {detail}",
            )

    except HTTPException:
        raise

    except Exception as exc:
        # If anything goes wrong, restore the previous transaction state.
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=f"Failed to upload dataset: {exc}",
        ) from exc

    # ---------------------------------------------------------
    # 6. Build response
    # ---------------------------------------------------------

    message = f"Ingested {result.rows_ingested} rows."

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