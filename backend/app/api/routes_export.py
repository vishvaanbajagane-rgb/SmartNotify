
"""
CSV export endpoint — generates the challenge-required output.csv from all
stored predictions.

GET /export/output-csv — build output.csv from the DB and download it
"""
import os

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.repositories.message_repository import list_all_messages_with_sender
from app.repositories.prediction_repository import list_predictions

router = APIRouter(tags=["export"])
settings = get_settings()


@router.get("/export/output-csv")
def export_output_csv(db: Session = Depends(get_db)) -> FileResponse:
    predictions = list_predictions(db)
    if not predictions:
        raise HTTPException(
            status_code=404,
            detail="No predictions found. Run POST /predict/batch first.",
        )

    messages_by_id = {m.id: m for m in list_all_messages_with_sender(db)}

    rows = []
    for p in predictions:
        message = messages_by_id.get(p.message_id)
        rows.append(
            {
                "message_id": p.message_id,
                "sender": message.sender.name if message else "",
                "content": message.content if message else "",
                "action": p.action.value,
                "message_type": message.message_type.value if message else "",
                "reason": p.reason,
                "confidence_score": p.confidence_score,
                "evidence_message_ids": p.evidence_message_ids,
                "business_trust_score": p.business_trust_score,
                "spam_probability": p.spam_probability,
                "scam_probability": p.scam_probability,
                "urgency_score": p.urgency_score,
            }
        )

    df = pd.DataFrame(rows)
    output_dir = os.path.dirname(settings.OUTPUT_PATH) or "."
    os.makedirs(output_dir, exist_ok=True)
    df.to_csv(settings.OUTPUT_PATH, index=False)

    return FileResponse(
        path=settings.OUTPUT_PATH,
        media_type="text/csv",
        filename="output.csv",
    )