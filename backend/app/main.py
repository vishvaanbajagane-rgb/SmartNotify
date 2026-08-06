"""
SmartNotify AI — FastAPI entrypoint.

Run locally:
    uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_health import router as health_router
from app.api.routes_upload import router as upload_router

# Phase 4
from app.api.routes_features import router as features_router

# Phase 5
from app.api.routes_predict import router as predict_router
from app.api.routes_export import router as export_router

# Phase 6
from app.api.routes_historical import router as historical_router

# Phase 7
from app.api.routes_trust import router as trust_router

# Phase 8
from app.api.routes_spam import router as spam_router

# Phase 9
from app.api.routes_scam import router as scam_router

# Phase 10
from app.api.routes_image import router as image_router

# Optional authentication
from app.api.routes_auth import router as auth_router

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

# Core
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(upload_router, prefix=settings.API_V1_PREFIX)

# Phase 4
app.include_router(features_router, prefix=settings.API_V1_PREFIX)

# Phase 5
app.include_router(predict_router, prefix=settings.API_V1_PREFIX)
app.include_router(export_router, prefix=settings.API_V1_PREFIX)

# Phase 6
app.include_router(historical_router, prefix=settings.API_V1_PREFIX)

# Phase 7
app.include_router(trust_router, prefix=settings.API_V1_PREFIX)

# Phase 8
app.include_router(spam_router, prefix=settings.API_V1_PREFIX)

# Phase 9
app.include_router(scam_router, prefix=settings.API_V1_PREFIX)

# Phase 10
app.include_router(image_router, prefix=settings.API_V1_PREFIX)

# Authentication (optional)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root() -> dict:
    return {
        "message": "SmartNotify AI backend is running",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
    }