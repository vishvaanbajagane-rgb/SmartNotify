# SmartNotify AI — WhatsApp Notification Router

> An explainable, multimodal AI system that classifies every incoming WhatsApp message into **Notify**, **Digest**, or **Mute** — using content, sender trust, history, group context, and multimedia signals.

Built for the **Message Notification Router AI Challenge**.

---

## 1. What This Project Does

WhatsApp overloads users with messages from friends, family, groups, and businesses. SmartNotify AI decides — per message — whether it deserves an **immediate notification**, should be **bundled into a digest**, or should be **silently muted**, based on:

- Message content & intent
- Sender/business trust score (learned from real history, not just a static default)
- User's historical interaction pattern with that sender/group (via semantic similarity search)
- Group context (broadcast vs. personal)
- Forward count / trained spam & scam classifiers
- Urgency signals
- Multimedia content (images via OCR, voice notes via Whisper transcription)

Every decision ships with a **confidence score** and a **human-readable reason**, making the system explainable rather than a black box.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling / UI | Tailwind CSS, shadcn/ui, Framer Motion |
| Charts | Recharts |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL |
| Authentication | JWT (python-jose) + bcrypt (passlib) |
| Embeddings / Semantic Search | Sentence Transformers + FAISS |
| Speech-to-Text | Whisper (local, `openai-whisper`) |
| OCR | EasyOCR + OpenCV preprocessing |
| Spam / Scam Classification | Scikit-learn (TF-IDF + Logistic Regression) |

All ML components run **locally / open-source**. Sentence-Transformers, Whisper, and EasyOCR download free model weights from their respective hosts on first use (needs internet once); scikit-learn's spam/scam classifiers train instantly offline on bundled seed data.

---

## 3. Build Plan — 15 Phases

Every phase below marked ✅ has been fully coded **and tested** (I run the actual code — endpoint calls, real image/audio processing, real DB writes — before handing it over, not just written and assumed correct).

| Phase | Name | Status |
|---|---|---|
| 1 | Project Foundation | ✅ Done |
| 2 | Database | ✅ Done |
| 3 | Dataset Ingestion | ✅ Done |
| 4 | Feature Engineering | ✅ Done |
| 5 | Decision Engine | ✅ Done |
| 6 | Historical Retrieval (FAISS) | ✅ Done |
| 7 | Business Trust | ✅ Done |
| 8 | Spam Detection | ✅ Done |
| 9 | Scam Detection | ✅ Done |
| 10 | OCR | ✅ Done |
| 11 | Whisper (Voice) | ✅ Done |
| — | Authentication (register/login/JWT) | ✅ Done — added ahead of schedule for frontend readiness |
| 12 | Analytics | ⏳ Next |
| 13 | Frontend | ⏳ Pending |
| 14 | Deployment | ⏳ Pending |
| 15 | Optimization | ⏳ Pending |

Say **"next"** at any time and I'll deliver the next phase — full code in copy-paste blocks plus a downloadable zip of the whole project as it stands.

---

## 4. Project Structure (current state — only files that actually exist)

```
smartnotify-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                        [Phase 1 → updated through Phase 11]
│   │   │
│   │   ├── api/
│   │   │   ├── routes_health.py           [Phase 1]
│   │   │   ├── routes_upload.py           [Phase 3]
│   │   │   ├── routes_features.py         [Phase 4]
│   │   │   ├── routes_predict.py          [Phase 5 → updated Phase 6]
│   │   │   ├── routes_export.py           [Phase 5]
│   │   │   ├── routes_historical.py       [Phase 6]
│   │   │   ├── routes_trust.py            [Phase 7]
│   │   │   ├── routes_spam.py             [Phase 8]
│   │   │   ├── routes_scam.py             [Phase 9]
│   │   │   ├── routes_image.py            [Phase 10]
│   │   │   ├── routes_voice.py            [Phase 11]
│   │   │   └── routes_auth.py             [Authentication]
│   │   │
│   │   ├── services/
│   │   │   ├── ingestion_service.py       [Phase 3]
│   │   │   ├── feature_engineering.py     [Phase 4]
│   │   │   ├── decision_engine.py         [Phase 5 → updated Phases 6, 7, 8, 9]
│   │   │   ├── confidence_scoring.py      [Phase 5]
│   │   │   ├── reason_generator.py        [Phase 5 → updated Phase 6]
│   │   │   ├── historical_retrieval.py    [Phase 6]
│   │   │   ├── business_trust.py          [Phase 7]
│   │   │   ├── spam_detection.py          [Phase 8]
│   │   │   ├── scam_detection.py          [Phase 9]
│   │   │   ├── ocr_service.py             [Phase 10]
│   │   │   └── voice_service.py           [Phase 11]
│   │   │
│   │   ├── models/
│   │   │   ├── db_models.py               [Phase 2 → updated Authentication]
│   │   │   └── schemas.py                 [Phase 2 → updated through Phase 11]
│   │   │
│   │   ├── repositories/
│   │   │   ├── message_repository.py      [Phase 3 → updated Phases 4, 7]
│   │   │   ├── prediction_repository.py   [Phase 5 → updated Phase 6]
│   │   │   └── user_repository.py         [Authentication]
│   │   │
│   │   ├── db/
│   │   │   └── session.py                 [Phase 2]
│   │   │
│   │   ├── core/
│   │   │   ├── config.py                  [Phase 1 → updated Authentication]
│   │   │   ├── security.py                [Authentication]
│   │   │   └── deps.py                    [Authentication]
│   │   │
│   │   └── utils/                          (empty — nothing needed here yet)
│   │
│   ├── ml_models/                          (empty dir — spam_model.pkl / scam_model.pkl /
│   │                                         faiss_index.bin generated at runtime, gitignored)
│   ├── dataset/
│   │   └── messages.csv                   [Phase 3]
│   │
│   ├── output/                             (empty dir — output.csv generated at runtime)
│   │
│   ├── requirements.txt                    [Phase 1 → updated Authentication]
│   ├── Dockerfile                          [Phase 1]
│   └── .env.example                        [Phase 1 → updated Authentication]
│
├── frontend/                               [Phase 13 — not started]
│
├── chat_transcript/                        [Phase 14 — not started]
│
├── docker-compose.yml                      [Phase 1]
├── .gitignore                              [Phase 1]
└── README.md
```

---

## 5. API Endpoints Built So Far

| Method | Path | Phase |
|---|---|---|
| GET | `/api/v1/health`, `/api/v1/health/db` | 1 |
| POST | `/api/v1/auth/register`, `/api/v1/auth/login` | Auth |
| GET | `/api/v1/auth/me` (protected) | Auth |
| POST | `/api/v1/upload` | 3 |
| GET | `/api/v1/messages` | 3 |
| GET | `/api/v1/features`, `/api/v1/features/{message_id}` | 4 |
| POST | `/api/v1/predict`, `/api/v1/predict/batch` | 5 |
| GET | `/api/v1/predict/{message_id}` | 5 |
| GET | `/api/v1/export/output-csv` | 5 |
| POST | `/api/v1/historical/rebuild-index` | 6 |
| GET | `/api/v1/historical/similar` | 6 |
| GET | `/api/v1/trust/{sender_id}` | 7 |
| GET | `/api/v1/spam-check` | 8 |
| GET | `/api/v1/scam-check` | 9 |
| POST | `/api/v1/analyze/image` | 10 |
| POST | `/api/v1/analyze/voice` | 11 |

---

## 6. Known Tuning Points (honest, not hidden)

A few messages land in boundary cases where scores are elevated but don't cross a threshold (e.g. a bank-impersonation scam scoring 35-48% instead of the 75% mute threshold). This is expected given the current heuristic+small-seed-classifier scoring — **Phase 15 (Optimization)** exists specifically to recalibrate thresholds once real usage data is available. Nothing here is silently broken; it's flagged so you know where to focus tuning later.

---

## 7. Authentication & Database

**Database:** PostgreSQL — locally via Docker Compose; free-tier hosted via **Neon** or **Supabase** for deployment (Phase 14).

**Authentication:** Full JWT-based register/login/protected-route system (see Authentication section above), built ahead of the original plan once it became clear the frontend (Phase 13) needs real login screens. No Supabase/Firebase needed — this is a self-contained system.

---

## 8. Do You Need External APIs?

Mostly **no**. Sentence-Transformers, Whisper, and EasyOCR download free model weights on first use (needs internet once, no API key); scikit-learn's spam/scam classifiers train instantly offline.

| Component | Default (Free, Local) | Optional Paid Alternative |
|---|---|---|
| Speech-to-Text | `openai-whisper` (local, one-time model download) | OpenAI Whisper API |
| OCR | EasyOCR (local, one-time model download) | Google Cloud Vision API |
| Embeddings | Sentence-Transformers (local, one-time model download) | OpenAI/Cohere embeddings API |
| Similarity Search | FAISS (local, no download) | Pinecone / Weaviate |
| Spam/Scam Classification | Scikit-learn (local, trains instantly) | — |

---

## 9. Free Hosting Plan (Phase 14)

| Piece | Free Host |
|---|---|
| Frontend (Next.js) | Vercel |
| Backend (FastAPI) | Render or Railway |
| Database (Postgres) | Neon or Supabase |

Full step-by-step deployment config comes in Phase 14, and we'll verify the live URL works end-to-end before calling it done.

---

## 10. How to Run What's Built So Far

```bash
cd backend
cp .env.example .env
cd ..
docker compose up --build
```

Then visit `http://localhost:8000/docs` for the interactive Swagger UI. You can:
- Register/login via `/auth/register` and `/auth/login`
- Upload `backend/dataset/messages.csv` via `/upload`
- Run `/predict/batch` to classify everything
- Try `/analyze/image` and `/analyze/voice` with your own files (first call downloads the EasyOCR/Whisper models — needs internet once)

---

## 11. Next Step

Say **"next"** and I'll deliver **Phase 12: Analytics** — full working code plus updated zip.