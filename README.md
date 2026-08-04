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
| Speech-to-Text | Whisper (local, `openai-whisper` or `faster-whisper`) |
| OCR | EasyOCR |
| Image Preprocessing | OpenCV |
| Classical ML (scam/spam/urgency scoring) | Scikit-learn |

All ML components run **locally / open-source** — no paid API key is strictly required. (Optional paid alternatives are listed in Section 5.)

---

## 3. Project Structure

```
smartnotify-ai/
├── frontend/                          # Next.js 15 app
│   ├── app/
│   │   ├── page.tsx                   # Landing Page
│   │   ├── dashboard/page.tsx         # Dashboard
│   │   ├── predict/page.tsx           # Prediction Page
│   │   ├── predict/[id]/page.tsx      # Prediction Details
│   │   ├── image-analysis/page.tsx    # Image Analysis
│   │   ├── voice-analysis/page.tsx    # Voice Analysis
│   │   ├── analytics/page.tsx         # Analytics
│   │   ├── upload/page.tsx            # CSV Upload
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives
│   │   ├── dashboard/                 # stat cards, charts, tables
│   │   ├── prediction/                # prediction row, drawer, evidence list
│   │   ├── notification/              # WhatsApp-style bubble simulation
│   │   └── shared/                    # navbar, sidebar, theme toggle
│   ├── lib/
│   │   ├── api.ts                     # typed API client (fetch wrappers)
│   │   ├── types.ts                   # shared TypeScript types
│   │   └── utils.ts
│   ├── hooks/
│   ├── public/
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── package.json
│   └── .env.local.example
│
├── backend/                            # FastAPI app
│   ├── app/
│   │   ├── main.py                    # FastAPI entrypoint
│   │   ├── api/
│   │   │   ├── routes_upload.py       # /upload
│   │   │   ├── routes_predict.py      # /predict, /predict/batch
│   │   │   ├── routes_image.py        # /analyze/image
│   │   │   ├── routes_voice.py        # /analyze/voice
│   │   │   ├── routes_analytics.py    # /analytics
│   │   │   └── routes_export.py       # /export/output-csv
│   │   ├── services/
│   │   │   ├── feature_engineering.py
│   │   │   ├── historical_retrieval.py   # FAISS + sentence-transformers
│   │   │   ├── business_trust.py
│   │   │   ├── spam_scam_detection.py
│   │   │   ├── urgency_detection.py
│   │   │   ├── ocr_service.py            # EasyOCR + OpenCV
│   │   │   ├── voice_service.py          # Whisper
│   │   │   ├── decision_engine.py        # combines all signals -> action
│   │   │   ├── confidence_scoring.py
│   │   │   └── reason_generator.py
│   │   ├── models/
│   │   │   ├── db_models.py            # SQLAlchemy ORM models
│   │   │   └── schemas.py              # Pydantic request/response schemas
│   │   ├── repositories/
│   │   │   └── message_repository.py
│   │   ├── db/
│   │   │   ├── session.py
│   │   │   └── migrations/             # Alembic
│   │   ├── core/
│   │   │   ├── config.py               # env settings
│   │   │   └── security.py             # auth (if enabled)
│   │   └── utils/
│   ├── ml_models/                      # saved sklearn/FAISS artifacts
│   ├── dataset/
│   │   └── messages.csv                # provided challenge dataset
│   ├── output/
│   │   └── output.csv                  # generated submission file
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── chat_transcript/
│   └── development_log.md              # AI-assisted dev process log
│
├── docker-compose.yml                  # postgres + backend + frontend
├── .gitignore
└── README.md
```

---

## 4. TypeScript Types You'll Need (`frontend/lib/types.ts`)

To keep the frontend fully type-safe and consistent with the FastAPI Pydantic schemas, define types like:

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
  confidenceScore: number;       // 0-1
  evidenceMessageIds: string[];
  businessTrustScore: number;    // 0-1
  spamProbability: number;       // 0-1
  scamProbability: number;       // 0-1
  urgencyScore: number;          // 0-1
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

Matching Pydantic schemas will live in `backend/app/models/schemas.py` — keeping request/response shapes identical on both sides avoids integration bugs, which matters a lot in a time-boxed hackathon build.

---

## 5. Do You Need External APIs?

Mostly **no** — this stack is designed to run on **open-source, local models**, which is ideal for a hackathon (no billing, no rate limits, works offline):

| Component | Default (Free, Local) | Optional Paid Alternative |
|---|---|---|
| Speech-to-Text | `whisper` / `faster-whisper` (runs locally) | OpenAI Whisper API (`api.openai.com`) |
| OCR | EasyOCR (local) | Google Cloud Vision API |
| Embeddings | Sentence-Transformers (local, e.g. `all-MiniLM-L6-v2`) | OpenAI/Cohere embeddings API |
| Similarity Search | FAISS (local, in-process) | Pinecone / Weaviate (hosted vector DB) |
| Classification (spam/scam/urgency) | Scikit-learn models you train on the dataset | — |

**Recommendation:** stay 100% local for the hackathon submission. It's faster to demo (no network dependency), free, and judges can run it offline. Only reach for a paid API if local Whisper/EasyOCR is too slow on your machine.

### If you do want an API key later
- **OpenAI** (Whisper/embeddings): create an account at platform.openai.com → API keys → generate key → store as `OPENAI_API_KEY` in `.env`.
- **Google Cloud Vision** (OCR): create a GCP project → enable Vision API → create a service account key (JSON) → store credentials path in `.env`.

I'll walk you through whichever one you actually choose to use, when we get to that module.

---

## 6. Authentication & Database

**Database: PostgreSQL**
- Stores: messages, predictions, user preferences, sender trust scores, historical interaction stats.
- For local dev: Docker Compose Postgres container.
- For free hosting: **Neon** or **Supabase** (both have generous free Postgres tiers, serverless, no credit card required to start).

**Authentication**
For a hackathon demo, you have two reasonable options:

1. **No auth / single-demo-user** (simplest, recommended if the judging criteria is about the ML pipeline, not multi-user SaaS). You just simulate "the user" as a fixed profile whose preferences drive personalization.
2. **Lightweight auth** if you want a real login screen:
   - **NextAuth.js (Auth.js)** on the frontend with a **Credentials** or **Google OAuth** provider — free, no external service needed for Credentials; Google OAuth just needs a free Google Cloud OAuth client ID.
   - Or **Supabase Auth**, which pairs naturally if you're already using Supabase for Postgres — gives you auth + DB from one free dashboard.

My recommendation: **skip auth entirely for the hackathon submission**, and add a "Login" module only if you have time left over after the core AI pipeline works — judges almost always weight the ML/decision-engine quality far higher than login screens.

---

## 7. How We'll Build This — Module by Module

I won't dump the entire codebase at once. Say **"next"** and I'll deliver the next module fully coded, in this order:

1. Backend scaffold (FastAPI app, config, DB models, Docker Compose w/ Postgres)
2. Dataset ingestion + `/upload` endpoint
3. Feature engineering + historical retrieval (Sentence-Transformers + FAISS)
4. Business trust + spam/scam/urgency detection (scikit-learn)
5. Decision engine + confidence scoring + reason generator
6. `/predict` and `/predict/batch` endpoints + `output.csv` export
7. OCR service (`/analyze/image`)
8. Voice service (`/analyze/voice`)
9. Analytics endpoint
10. Frontend scaffold (Next.js 15 + Tailwind + shadcn/ui setup, theme, layout)
11. Landing Page
12. Dashboard
13. Prediction Page + Prediction Details drawer
14. Image Analysis page
15. Voice Analysis page
16. Analytics page (Recharts)
17. CSV Upload page
18. Final polish (WhatsApp-style notification simulation, animations, dark mode)
19. Deployment configs (Vercel + Render/Railway + Neon/Supabase)
20. `chat_transcript/development_log.md` + final packaging (`code.zip`, `output.csv`)

I'll track where we are so you can just say "next" repeatedly without re-explaining context.

---

## 8. Free Hosting Plan (Section 9 answer)

| Piece | Free Host | Notes |
|---|---|---|
| Frontend (Next.js) | **Vercel** | Native Next.js support, auto CI/CD from GitHub, free SSL + domain |
| Backend (FastAPI) | **Render** (free web service) or **Railway** (free trial credits) | Free tier sleeps after inactivity — fine for a demo |
| Database (Postgres) | **Neon** or **Supabase** | Free tier, serverless Postgres, works great with Render/Vercel |
| Model weights (Whisper/EasyOCR) | Bundled in backend Docker image or downloaded on first boot | Keep model size in mind — free tiers have limited RAM/disk |

Deployment flow: push to GitHub → connect repo to Vercel (frontend) and Render (backend) → both auto-deploy on push → set environment variables (DB connection string, any API keys) in each platform's dashboard → done. I'll give you exact step-by-step configs (Dockerfile, `render.yaml`, Vercel env vars) as their own module near the end, and we'll verify the live URL actually works end-to-end before calling it done.

---

## 9. Next Step

Say **"next"** whenever you're ready and I'll deliver **Module 1: Backend scaffold** — full working code, ready to run.