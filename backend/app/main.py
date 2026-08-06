"""
SmartNotify AI — FastAPI entrypoint.

Run locally:
    uvicorn app.main:app --reload --port 8000

Modules will register their routers here as they're built:
    routes_upload, routes_predict, routes_image, routes_voice,
    routes_analytics, routes_export
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_health import router as health_router
from app.core.config import get_settings
from app.db.session import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist (dev convenience; use Alembic in prod)
    init_db()
    yield
    # Shutdown: nothing to clean up yet


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

app.include_router(health_router, prefix=settings.API_V1_PREFIX)

# --- Future module routers (uncommented as each module is built) ---
# app.include_router(upload_router, prefix=settings.API_V1_PREFIX)
# app.include_router(predict_router, prefix=settings.API_V1_PREFIX)
# app.include_router(image_router, prefix=settings.API_V1_PREFIX)
# app.include_router(voice_router, prefix=settings.API_V1_PREFIX)
# app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
# app.include_router(export_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root() -> dict:
    return {
        "message": "SmartNotify AI backend is running",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
    }

from app.api.routes_auth import router as auth_router
from app.api.routes_historical import router as historical_router
from app.api.routes_trust import router as trust_router
from app.api.routes_spam import router as spam_router
...
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(historical_router, prefix=settings.API_V1_PREFIX)
app.include_router(trust_router, prefix=settings.API_V1_PREFIX)
app.include_router(spam_router, prefix=settings.API_V1_PREFIX)

from app.api.routes_image import router as image_router
from app.api.routes_scam import router as scam_router
...
app.include_router(scam_router, prefix=settings.API_V1_PREFIX)
app.include_router(image_router, prefix=settings.API_V1_PREFIX)