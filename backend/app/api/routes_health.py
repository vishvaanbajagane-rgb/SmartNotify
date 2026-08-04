"""Basic health/readiness endpoints — useful for Docker/Render health checks."""
from fastapi import APIRouter
from sqlalchemy import text

from app.db.session import SessionLocal

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok", "service": "SmartNotify AI backend"}


@router.get("/health/db")
def db_health_check() -> dict:
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ok", "database": "connected"}
    except Exception as exc:  # noqa: BLE001
        return {"status": "error", "database": "unreachable", "detail": str(exc)}
