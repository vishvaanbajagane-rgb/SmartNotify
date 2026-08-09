"""
Feature inspection endpoints — lets you verify Phase 4's feature extraction
against real ingested messages before Phase 5 (decision engine) consumes it.

GET /features/{message_id}   — features for one message
GET /features                — features for every ingested message
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.schemas import MessageFeaturesOut
from app.repositories.message_repository import get_message_by_id, list_all_messages_with_sender
from app.services.feature_engineering import extract_features

router = APIRouter(tags=["features"])


@router.get("/features/{message_id}", response_model=MessageFeaturesOut)
def get_message_features(message_id: str, db: Session = Depends(get_db)) -> MessageFeaturesOut:
    message = get_message_by_id(db, message_id)
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found.")

    features = extract_features(message)
    return MessageFeaturesOut(**features.to_dict())


@router.get("/features", response_model=list[MessageFeaturesOut])
def get_all_message_features(db: Session = Depends(get_db)) -> list[MessageFeaturesOut]:
    messages = list_all_messages_with_sender(db)
    return [MessageFeaturesOut(**extract_features(m).to_dict()) for m in messages]
