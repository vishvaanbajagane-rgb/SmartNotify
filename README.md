# SmartNotify AI — WhatsApp Notification Router

> An explainable, multimodal AI system that classifies every incoming WhatsApp message into **Notify**, **Digest**, or **Mute** — using content, sender trust, history, group context, and multimedia signals.

Built for the **Message Notification Router AI Challenge**.

---

## 1. What This Project Does

WhatsApp overloads users with messages from friends, family, groups, and businesses. SmartNotify AI decides — per message — whether it deserves an **immediate notification**, should be **bundled into a digest**, or should be **silently muted**, based on:

- Message content & intent
- Sender/business trust score
- User's historical interaction pattern with that sender/group
- Group context (broadcast vs. personal)
- Forward count / spam & scam indicators
- Urgency signals
- Multimedia content (images via OCR, voice notes via transcription)

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
| Embeddings / Semantic Search | Sentence Transformers + FAISS |
| Speech-to-Text | Whisper (local, `openai-whisper`) |
| OCR | EasyOCR |
| Image Preprocessing | OpenCV |
| Classical ML (scam/spam/urgency scoring) | Scikit-learn |

All ML components run **locally / open-source** — no paid API key is strictly required.

---

## 3. Build Plan — 15 Phases

This project is being built phase by phase, not all at once. Each phase is fully coded and tested (I run the code before handing it over, not just write it) before moving to the next.

| Phase | Name | Status |
|---|---|---|
| 1 | Project Foundation | ✅ Done — FastAPI app, config, Docker Compose w/ Postgres |
| 2 | Database | ✅ Done — SQLAlchemy models (Sender, Message, Prediction, UserPreference, InteractionHistory), Pydantic schemas |
| 3 | Dataset Ingestion | ✅ Done — CSV upload endpoint, flexible column mapping, tested end-to-end |
| 4 | Feature Engineering | ⏳ Next |
| 5 | Decision Engine | ⏳ Pending |
| 6 | Historical Retrieval (FAISS) | ⏳ Pending |
| 7 | Business Trust | ⏳ Pending |
| 8 | Spam Detection | ⏳ Pending |
| 9 | Scam Detection | ⏳ Pending |
| 10 | OCR | ⏳ Pending |
| 11 | Whisper (Voice) | ⏳ Pending |
| 12 | Analytics | ⏳ Pending |
| 13 | Frontend | ⏳ Pending |
| 14 | Deployment | ⏳ Pending |
| 15 | Optimization | ⏳ Pending |

Say **"next"** at any time and I'll deliver the next phase — full code in copy-paste blocks plus a downloadable zip of the whole project as it stands.

---

## 4. Project Structure (current state)

```
smartnotify-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                        [Phase 1, updated Phase 3]
│   │   ├── api/
│   │   │   ├── routes_health.py           [Phase 1] ✅
│   │   │   ├── routes_upload.py           [Phase 3] ✅
│   │   │   ├── routes_predict.py          [Phase 5]  pending
│   │   │   ├── routes_image.py            [Phase 10] pending
│   │   │   ├── routes_voice.py            [Phase 11] pending
│   │   │   ├── routes_analytics.py        [Phase 12] pending
│   │   │   └── routes_export.py           [Phase 5]  pending
│   │   ├── services/
│   │   │   ├── ingestion_service.py       [Phase 3]  ✅
│   │   │   ├── feature_engineering.py     [Phase 4]  pending
│   │   │   ├── decision_engine.py         [Phase 5]  pending
│   │   │   ├── confidence_scoring.py      [Phase 5]  pending
│   │   │   ├── reason_generator.py        [Phase 5]  pending
│   │   │   ├── historical_retrieval.py    [Phase 6]  pending
│   │   │   ├── business_trust.py          [Phase 7]  pending
│   │   │   ├── spam_detection.py          [Phase 8]  pending
│   │   │   ├── scam_detection.py          [Phase 9]  pending
│   │   │   ├── ocr_service.py             [Phase 10] pending
│   │   │   └── voice_service.py           [Phase 11] pending
│   │   ├── models/
│   │   │   ├── db_models.py               [Phase 2]  ✅
│   │   │   └── schemas.py                 [Phase 2, updated each phase] ✅
│   │   ├── repositories/
│   │   │   └── message_repository.py      [Phase 3]  ✅
│   │   ├── db/
│   │   │   ├── session.py                 [Phase 2]  ✅
│   │   │   └── migrations/                [Phase 2, optional Alembic]
│   │   ├── core/
│   │   │   └── config.py                  [Phase 1]  ✅
│   │   └── utils/
│   ├── ml_models/                          [Phase 6-9 store trained artifacts here]
│   ├── dataset/
│   │   └── messages.csv                   [Phase 3]  ✅ sample data
│   ├── output/
│   │   └── output.csv                     [Phase 5, generated]
│   ├── requirements.txt                    [Phase 1]  ✅
│   ├── Dockerfile                          [Phase 1]  ✅
│   └── .env.example                        [Phase 1]  ✅
│
├── frontend/                               [Phase 13] not started
│   └── ... (built in Phase 13)
│
├── chat_transcript/
│   └── development_log.md                  [Phase 14, final packaging]
│
├── docker-compose.yml                       [Phase 1]  ✅
├── .gitignore                               [Phase 1]  ✅
└── README.md
```

---

## 5. TypeScript Types (for `frontend/lib/types.ts`, built in Phase 13)

```typescript
export type Action = "Notify" | "Digest" | "Mute";
export type MessageType = "text" | "image" | "voice";

export interface Message {
  id: string;
  sender: string;
  senderType: "contact" | "business" | "group";
  content: string;
  messageType: MessageType;
  timestamp: string;
  groupName?: string;
  mediaUrl?: string;
}

export interface Prediction {
  messageId: string;
  action: Action;
  messageType: MessageType;
  reason: string;
  confidenceScore: number;
  evidenceMessageIds: string[];
  businessTrustScore: number;
  spamProbability: number;
  scamProbability: number;
  urgencyScore: number;
}

export interface AnalyticsSummary {
  totalMessages: number;
  actionBreakdown: Record<Action, number>;
  avgConfidence: number;
  topFlaggedSenders: { sender: string; scamProbability: number }[];
}

export interface OCRResult {
  extractedText: string;
  detectedLanguage?: string;
  confidence: number;
}

export interface TranscriptionResult {
  transcript: string;
  language: string;
  durationSeconds: number;
}
```

---

## 6. Do You Need External APIs?

Mostly **no** — Whisper, EasyOCR, Sentence-Transformers, and FAISS all run locally and free. Ideal for a hackathon: no billing, no rate limits, works offline.

| Component | Default (Free, Local) | Optional Paid Alternative |
|---|---|---|
| Speech-to-Text | `openai-whisper` (local) | OpenAI Whisper API |
| OCR | EasyOCR (local) | Google Cloud Vision API |
| Embeddings | Sentence-Transformers (local) | OpenAI/Cohere embeddings API |
| Similarity Search | FAISS (local) | Pinecone / Weaviate |
| Classification | Scikit-learn (trained on your dataset) | — |

If you want a paid API later, I'll walk you through getting the key when we reach that phase.

---

## 7. Authentication & Database

**Database:** PostgreSQL — locally via Docker Compose; free-tier hosted via **Neon** or **Supabase** for deployment (Phase 14).

**Authentication:** Skipped for this build — the challenge is judged on the AI decision pipeline, not login screens. A single demo-user profile drives personalization instead.

---

## 8. Free Hosting Plan (Phase 14)

| Piece | Free Host |
|---|---|
| Frontend (Next.js) | Vercel |
| Backend (FastAPI) | Render or Railway |
| Database (Postgres) | Neon or Supabase |

Full step-by-step deployment config (Dockerfile, `render.yaml`, Vercel env vars) comes in Phase 14, and we'll verify the live URL works end-to-end before calling it done.

---

## 9. How to Run What's Built So Far

```bash
cd backend
cp .env.example .env
cd ..
docker compose up --build
```

Then visit `http://localhost:8000/docs` for the interactive Swagger UI — you can upload `backend/dataset/messages.csv` there directly and see it ingested.

---

## 10. Next Step
