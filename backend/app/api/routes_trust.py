"""
Business trust endpoints (Phase 7).

GET /trust/{sender_id} — inspect a sender's computed trust score and the
                          history behind it, for verification/debugging.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.schemas import SenderTrustOut
from app.repositories.message_repository import get_sender_by_id
from app.services.business_trust import compute_sender_trust

router = APIRouter(tags=["trust"])


@router.get("/trust/{sender_id}", response_model=SenderTrustOut)
def get_sender_trust(sender_id: str, db: Session = Depends(get_db)) -> SenderTrustOut:
    sender = get_sender_by_id(db, sender_id)
    if sender is None:
        raise HTTPException(status_code=404, detail="Sender not found.")

    result = compute_sender_trust(db, sender)
    return SenderTrustOut(
        sender_id=sender.id,
        sender_name=sender.name,
        trust_score=result.trust_score,
        message_count=result.message_count,
        mute_rate=result.mute_rate,
        notify_rate=result.notify_rate,
        basis=result.basis,
    )