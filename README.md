# SmartNotify AI — WhatsApp Notification Router

> An explainable, multimodal AI system that classifies every incoming WhatsApp message into **Notify**, **Digest**, or **Mute** — using content, sender trust, history, group context, and multimedia signals.

Built for the **Message Notification Router AI Challenge**.

---

## 1. What This Project Does

WhatsApp overloads users with messages from friends, family, groups, and businesses. SmartNotify AI decides — per message — whether it deserves an **immediate notification**, should be **bundled into a digest**, or should be **silently muted**, based on:

- Message content & intent
- Sender/business trust score (learned from real history, not a static default)
- Historical similarity to past messages (semantic search via FAISS)
- Group context (broadcast vs. personal)
- Forward count / trained spam & scam classifiers
- Urgency signals
- Multimedia content (images via OCR, voice notes via Whisper transcription)

Every decision ships with a **confidence score** and a **human-readable reason**.

---

## 2. Status: Backend + Frontend Complete

| Phase | Name | Status |
|---|---|---|
| 1 | Project Foundation | ✅ Done & tested |
| 2 | Database | ✅ Done & tested |
| 3 | Dataset Ingestion | ✅ Done & tested — flexible column matching verified against 8 real-world CSV formats |
| 4 | Feature Engineering | ✅ Done & tested |
| 5 | Decision Engine | ✅ Done & tested |
| 6 | Historical Retrieval (FAISS) | ✅ Done — FAISS logic tested; embedding model needs internet on first run |
| 7 | Business Trust | ✅ Done & tested |
| 8 | Spam Detection | ✅ Done & tested |
| 9 | Scam Detection | ✅ Done & tested |
| 10 | OCR | ✅ Done — OpenCV pipeline tested; EasyOCR model needs internet on first run |
| 11 | Whisper (Voice) | ✅ Done — temp-file handling tested; Whisper model needs internet on first run |
| 12 | Analytics | ✅ Done & tested |
| — | Authentication (JWT register/login) | ✅ Done & tested |
| 13 / 16 | Frontend — all 8 pages | ✅ Done & build-tested: Landing, Dashboard, Predict + Details, Image Analysis, Voice Analysis, Analytics, Upload |
| 14 | Deployment configs | ✅ Done — Render blueprint, Vercel env template, CI workflow (Docker build itself untested, no Docker in dev sandbox) |
| 15 | Optimization | ✅ Done — 28 passing automated tests, evidence-based threshold tuning, multi-stage Dockerfile, admin retrain endpoints |
| — | Polish pass | ✅ Done — WhatsApp notification simulation, global page-transition animation |

**28/28 backend tests passing.** Every frontend page has been built with `npm run build` and confirmed to compile cleanly.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15.5 (App Router), React 19, TypeScript |
| Styling / UI | Tailwind CSS, Framer Motion, Recharts, Lucide icons |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL |
| Authentication | JWT (python-jose) + bcrypt (passlib) |
| Embeddings / Semantic Search | Sentence Transformers + FAISS |
| Speech-to-Text | Whisper (local, `openai-whisper`) |
| OCR | EasyOCR + OpenCV preprocessing |
| Spam / Scam Classification | Scikit-learn (TF-IDF + Logistic Regression) |
| Testing | Pytest (backend), TypeScript strict mode + `next build` (frontend) |

---

## 4. Project Structure

```
smartnotify-ai/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/            # 12 route modules — health, auth, upload, features,
│   │   │                    # predict, export, historical, trust, spam, scam,
│   │   │                    # image, voice, analytics
│   │   ├── services/       # ingestion, feature_engineering, decision_engine,
│   │   │                    # confidence_scoring, reason_generator,
│   │   │                    # historical_retrieval, business_trust,
│   │   │                    # spam_detection, scam_detection, ocr_service,
│   │   │                    # voice_service, analytics_service
│   │   ├── models/          # db_models.py, schemas.py
│   │   ├── repositories/    # message, prediction, user
│   │   ├── db/               # session.py
│   │   └── core/             # config.py, security.py, deps.py
│   ├── tests/                 # 28 pytest tests: decision engine, auth, pipeline
│   ├── scripts/
│   │   └── evaluate_thresholds.py   # evidence-based threshold tuning harness
│   ├── ml_models/              # spam_model.pkl / scam_model.pkl / faiss_index.bin
│   │                            # (generated at runtime, gitignored)
│   ├── dataset/messages.csv
│   ├── output/                  # output.csv generated at runtime
│   ├── requirements.txt
│   ├── Dockerfile               # multi-stage, smaller runtime image
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                # Landing (triage-lane demo + notification sim)
│   │   ├── dashboard/page.tsx
│   │   ├── predict/page.tsx        # + Prediction Details drawer
│   │   ├── image-analysis/page.tsx
│   │   ├── voice-analysis/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── upload/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── shared/         # navbar, score-bar, sender-fields, page-fade-in
│   │   ├── dashboard/       # stat-card, action-breakdown-chart, trend-chart,
│   │   │                     # flagged-senders-list
│   │   ├── predict/          # action-badge, prediction-form, prediction-table,
│   │   │                      # prediction-details-drawer
│   │   ├── upload/            # dropzone, message-preview-table
│   │   ├── image-analysis/    # image-dropzone, image-result-card
│   │   ├── voice-analysis/    # audio-dropzone, voice-result-card
│   │   ├── analytics/          # message-type-chart, risk-summary
│   │   └── landing/            # triage-lane-demo, whatsapp-notification-demo,
│   │                            # feature-grid
│   ├── lib/                 # api.ts, types.ts, utils.ts, chart-colors.ts
│   ├── package.json          # next@15.5.23 — patched for CVE-2025-66478
│   └── Dockerfile             # local docker-compose only; Vercel builds prod
│
├── .github/workflows/ci.yml     # backend pytest + frontend build on every push
├── render.yaml                    # backend + Postgres deployment blueprint
├── docker-compose.yml              # full stack: db + backend + frontend
└── .gitignore
```

---

## 5. API Endpoints

| Method | Path | Phase |
|---|---|---|
| GET | `/api/v1/health`, `/api/v1/health/db` | 1 |
| POST | `/api/v1/auth/register`, `/api/v1/auth/login` | Auth |
| GET | `/api/v1/auth/me` (protected) | Auth |
| POST | `/api/v1/upload` | 3 |
| GET | `/api/v1/messages` | 3 |
| GET | `/api/v1/features`, `/api/v1/features/{id}` | 4 |
| POST | `/api/v1/predict`, `/api/v1/predict/batch` | 5 |
| GET | `/api/v1/predict/{id}` | 5 |
| GET | `/api/v1/export/output-csv` | 5 |
| POST | `/api/v1/historical/rebuild-index` | 6 |
| GET | `/api/v1/historical/similar` | 6 |
| GET | `/api/v1/trust/{sender_id}` | 7 |
| GET | `/api/v1/spam-check` · POST `/spam-check/retrain` (protected) | 8, 15 |
| GET | `/api/v1/scam-check` · POST `/scam-check/retrain` (protected) | 9, 15 |
| POST | `/api/v1/analyze/image` | 10 |
| POST | `/api/v1/analyze/voice` | 11 |
| GET | `/api/v1/analytics` | 12 |

---

## 6. Known, Honestly-Flagged Limitations

- **Threshold tuning** was done against a 6-example labeled set (`scripts/evaluate_thresholds.py`). 100% accuracy on 6 examples is a starting point, not a ceiling — grow the eval set as real data comes in.
- **Docker build was never run end-to-end** in the dev sandbox (no `docker` binary available). Dockerfile syntax was reviewed carefully but not build-tested — verify on your machine before relying on it for deployment.
- **EasyOCR / Whisper / Sentence-Transformers models** all need internet on first run to download weights (free, no API key). Confirmed reachable for EasyOCR in testing; Whisper and Sentence-Transformers download hosts weren't reachable from the dev sandbox specifically, but this is a standard, well-supported flow that works normally with real internet access.
- **No true light/dark theme toggle.** The frontend was intentionally designed dark-first with hardcoded color tokens (not CSS variables) tied directly to the product's Notify/Digest/Mute semantics. A real toggle would need a parallel light palette and a token refactor — happy to build it as a follow-up if wanted.
- **`chat_transcript/development_log.md`** (from the original challenge deliverables) hasn't been created yet.

---

## 7. Authentication & Database

**Database:** PostgreSQL — locally via Docker Compose; free-tier hosted via Neon or Supabase for deployment.

**Authentication:** Full JWT register/login/protected-route system — no Supabase/Firebase needed, this is self-contained.

---

## 8. Free Hosting Plan

| Piece | Free Host |
|---|---|
| Frontend (Next.js) | Vercel |
| Backend (FastAPI) | Render (see `render.yaml`) |
| Database (Postgres) | Neon or Supabase, or Render's free Postgres (90-day expiry) |

Deployment steps: push to GitHub → Render Blueprint reads `render.yaml` and provisions backend + DB → Vercel imports `frontend/` and builds → set `NEXT_PUBLIC_API_URL` in Vercel to the Render URL → set `CORS_ORIGINS` in Render to the Vercel URL.

---

## 9. How to Run This Locally

```bash
# Backend + Postgres
cd backend
cp .env.example .env
cd ..
docker compose up --build
```

Backend: `http://localhost:8000/docs` · Frontend: `http://localhost:3000`

Or run the frontend separately for faster iteration:
```bash
cd frontend
cp .env.production.example .env.local   # points at localhost:8000 by default
npm install
npm run dev
```

Run the backend test suite:
```bash
cd backend
DATABASE_URL="sqlite:///./test.db" pytest -v
```

---

## 10. Remaining Work

1. `chat_transcript/development_log.md` — final packaging deliverable from the original challenge brief.
2. Real `docker build` verification (untestable in this dev sandbox).
3. Optional: light theme toggle, if wanted.
4. Grow the threshold-tuning eval set with real labeled data.
