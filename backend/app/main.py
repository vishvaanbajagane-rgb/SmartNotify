"""
SmartNotify AI — FastAPI entrypoint.

Run locally:
    uvicorn app.main:app --reload --port 8000
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_auth import router as auth_router
from app.api.routes_export import router as export_router
from app.api.routes_features import router as features_router
from app.api.routes_health import router as health_router
from app.api.routes_historical import router as historical_router
from app.api.routes_image import router as image_router
from app.api.routes_predict import router as predict_router
from app.api.routes_scam import router as scam_router
from app.api.routes_spam import router as spam_router
from app.api.routes_trust import router as trust_router
from app.api.routes_upload import router as upload_router
from app.api.routes_voice import router as voice_router
from app.core.config import get_settings
from app.db.session import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Explainable AI router that classifies WhatsApp messages into Notify / Digest / Mute.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(upload_router, prefix=settings.API_V1_PREFIX)
app.include_router(features_router, prefix=settings.API_V1_PREFIX)
app.include_router(predict_router, prefix=settings.API_V1_PREFIX)
app.include_router(export_router, prefix=settings.API_V1_PREFIX)
app.include_router(historical_router, prefix=settings.API_V1_PREFIX)
app.include_router(trust_router, prefix=settings.API_V1_PREFIX)
app.include_router(spam_router, prefix=settings.API_V1_PREFIX)
app.include_router(scam_router, prefix=settings.API_V1_PREFIX)
app.include_router(image_router, prefix=settings.API_V1_PREFIX)
app.include_router(voice_router, prefix=settings.API_V1_PREFIX)

# --- Future phase routers (uncommented as each phase is built) ---
# app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)    # Phase 12


@app.get("/")
def root() -> dict:
    return {
        "message": "SmartNotify AI backend is running",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
    }

from app.api.routes_analytics import router as analytics_router
...
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)