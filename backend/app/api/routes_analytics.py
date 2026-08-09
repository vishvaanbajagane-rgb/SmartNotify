"""
Analytics endpoints (Phase 12).

GET /analytics — dashboard-ready summary stats, powering the Dashboard
                  and Analytics pages (Phase 13).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.schemas import (
    ActionBreakdown,
    AnalyticsSummary,
    DailyActionCount,
    FlaggedSender,
    MessageTypeBreakdown,
)
from app.services.analytics_service import compute_analytics

router = APIRouter(tags=["analytics"])


@router.get("/analytics", response_model=AnalyticsSummary)
def get_analytics(db: Session = Depends(get_db)) -> AnalyticsSummary:
    result = compute_analytics(db)

    return AnalyticsSummary(
        total_messages=result.total_messages,
        action_breakdown=ActionBreakdown(**result.action_counts),
        message_type_breakdown=MessageTypeBreakdown(**result.message_type_counts),
        avg_confidence=result.avg_confidence,
        avg_scam_probability=result.avg_scam_probability,
        avg_spam_probability=result.avg_spam_probability,
        top_flagged_senders=[
            FlaggedSender(sender=name, scam_probability=score)
            for name, score in result.top_flagged_senders
        ],
        daily_action_counts=[DailyActionCount(**row) for row in result.daily_action_counts],
    )
