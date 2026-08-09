# SmartNotify AI — Development Log

## Project

**Project Name:** SmartNotify AI  
**Description:** Explainable AI-powered WhatsApp Notification Router  
**Core Classification:** Notify / Digest / Mute

---

# 1. Project Objective

SmartNotify AI is designed to intelligently classify incoming WhatsApp-style
messages into three notification actions:

- Notify
- Digest
- Mute

The system considers message content, sender information, message features,
historical interactions, sender trust, spam probability, scam probability,
urgency, and multimedia information.

The goal is to reduce notification overload while keeping important messages
visible and suppressing potentially harmful or low-value messages.

---

# 2. Technology Stack

## Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL
- FAISS
- Sentence Transformers
- Whisper
- OCR
- Scikit-learn

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- shadcn/ui

## Infrastructure

- Docker
- Docker Compose
- PostgreSQL

---

# 3. Backend Development

## Phase 1 — Project Foundation

The backend application was structured around FastAPI.

Main application entry point:

`backend/app/main.py`

The application exposes the API routers and initializes the application
lifecycle.

---

## Phase 2 — Database

PostgreSQL was selected as the project database.

Database access is implemented through SQLAlchemy.

Relevant files:

- `backend/app/db/session.py`
- `backend/app/models/db_models.py`
- `backend/app/repositories/`

Docker Compose provides PostgreSQL for local development.

---

## Phase 3 — Dataset Ingestion

CSV dataset ingestion was implemented in:

`backend/app/services/ingestion_service.py`

The ingestion system was later improved to support different realistic CSV
column names.

Supported sender aliases include:

- sender
- sender_name
- from
- contact
- name
- author
- phone
- phone_number
- number
- username
- user
- sender_phone

Supported content aliases include:

- content
- message
- text
- message_content
- body
- msg
- description
- text_content
- sms_body
- message_text

Column names are normalized so variations such as:

`Phone Number`

`phone-number`

`phone_number`

can resolve to the same logical field.

This makes the uploader suitable for WhatsApp exports, SMS/Twilio-style
exports, and generic sender/message CSV files.

---

# 4. Feature Engineering

Message-level features are extracted by:

`backend/app/services/feature_engineering.py`

Features include:

- text length
- word count
- exclamation count
- question count
- capital-letter ratio
- digit ratio
- URLs
- phone numbers
- currency symbols
- urgency keywords
- scam keywords
- spam keywords
- sender type
- group-message information
- business information
- sender trust
- forwarding count
- message type
- hour of day
- late-night status

These features are used by the decision engine.

---

# 5. Decision Engine

The central classification logic is implemented in:

`backend/app/services/decision_engine.py`

The decision engine combines multiple signals and produces:

- action
- reason
- confidence score
- evidence message IDs
- business trust score
- spam probability
- scam probability
- urgency score

The final action is one of:

- Notify
- Digest
- Mute

---

# 6. Confidence Scoring

Confidence calculation is implemented in:

`backend/app/services/confidence_scoring.py`

The confidence score is used to communicate how strongly the system
supports its classification.

The implementation also supports threshold-based decision making.

---

# 7. Historical Retrieval

Historical semantic retrieval is implemented in:

`backend/app/services/historical_retrieval.py`

The implementation uses:

- Sentence Transformers
- `all-MiniLM-L6-v2`
- FAISS
- cosine-similarity-style inner-product search

The system retrieves similar historical messages and uses them as evidence
for explainability and personalization.

The resulting message IDs are exposed through:

`evidence_message_ids`

---

# 8. Business Trust

Sender/business trust information is incorporated into the decision process.

Relevant repository/service functionality tracks sender characteristics,
message counts, and historical actions.

This allows trusted businesses and senders to influence the classification
without relying only on message text.

---

# 9. Spam Detection

Spam detection is integrated into the decision engine.

The spam probability is exposed through the prediction contract as:

`spam_probability`

A dedicated spam-check response is also provided by the API.

---

# 10. Scam Detection

Scam detection is integrated into the decision engine.

The system calculates:

`scam_probability`

High-risk messages can therefore be suppressed instead of generating
unnecessary notifications.

---

# 11. Image Analysis

Image messages are supported through the image-analysis API.

Relevant files include:

- `backend/app/api/routes_image.py`
- `backend/app/models/schemas.py`

OCR results include extracted text, detected language, and confidence.

The extracted information can then participate in the notification decision.

---

# 12. Voice Analysis

Voice messages are supported through the voice-analysis API.

Relevant files include:

- `backend/app/api/routes_voice.py`
- `backend/app/models/schemas.py`

Audio is transcribed and the transcription can be analyzed as message content.

---

# 13. Analytics

Analytics functionality is exposed through:

`backend/app/api/routes_analytics.py`

The API provides aggregated information such as:

- total messages
- action breakdown
- average confidence
- flagged senders
- daily action counts
- message-type breakdowns

---

# 14. Authentication

Authentication functionality was added using:

- user creation
- login
- password validation
- JWT access tokens

The API contract is represented through schemas such as:

- `UserCreate`
- `UserOut`
- `LoginRequest`
- `TokenResponse`

These are defined in:

`backend/app/models/schemas.py`

---

# 15. Frontend

The frontend was implemented using Next.js, React and TypeScript.

The frontend contains the planned application pages for:

- Landing
- Dashboard
- Prediction
- Prediction Details
- Image Analysis
- Voice Analysis
- Analytics
- CSV Upload

The frontend was verified with a production build.

---

# 16. CSV Upload Experience

The CSV uploader was designed to avoid forcing users to use one exact
column naming convention.

The frontend upload component communicates that columns are automatically
detected.

Backend ingestion performs normalization and alias matching.

This allows multiple CSV formats to be accepted as long as sender and
message content can be identified.

---

# 17. WhatsApp Notification Simulation

A WhatsApp-style notification simulation was added to the landing page.

File:

`frontend/components/landing/whatsapp-notification-demo.tsx`

The simulation demonstrates:

### Notify

An important message appears immediately as a notification.

### Digest

Several lower-priority messages are bundled together.

### Mute

A low-value or high-risk message is silently suppressed.

This makes the core SmartNotify concept visually understandable without
requiring the visitor to interact with the full dashboard.

---

# 18. Frontend Page Animation

A lightweight page-enter animation was added.

File:

`frontend/components/shared/page-fade-in.tsx`

The component is applied globally through:

`frontend/app/layout.tsx`

This provides a subtle fade-and-slide transition when application pages
appear.

---

# 19. API Prediction Flow

The prediction API is implemented in:

`backend/app/api/routes_predict.py`

Main endpoints include:

- `POST /predict`
- `POST /predict/batch`
- `GET /predict/{message_id}`

The prediction endpoint:

1. Creates or retrieves the sender.
2. Creates the message.
3. Sends the message to the decision engine.
4. Saves the prediction.
5. Returns the classification and supporting signals.

---

# 20. Prediction Contract

The API schemas are defined in:

`backend/app/models/schemas.py`

The prediction response contains:

- message ID
- action
- reason
- confidence score
- historical evidence IDs
- business trust score
- spam probability
- scam probability
- urgency score

This keeps the backend and frontend API contract consistent.

---

# 21. Testing

Automated pipeline tests were implemented in:

`backend/tests/test_pipeline.py`

The latest reported test status is:

**28/28 tests passing.**

CSV ingestion regression coverage includes multiple realistic CSV formats.

---

# 22. Docker

Docker Compose configuration is available at:

`docker-compose.yml`

The PostgreSQL service uses:

`postgres:16-alpine`

The database is exposed on:

`5432`

The backend is configured for:

`8000`

Docker Compose was successfully used to start the PostgreSQL database locally.

---

# 23. Deployment Configuration

Deployment-related configuration has been included for the project.

The repository also contains environment templates and deployment-related
configuration intended to keep secrets outside the source code.

---

# 24. Known Final Verification Tasks

The following items still require verification on the development machine:

1. Create and configure the real `.env` files.
2. Start PostgreSQL, backend, and frontend together.
3. Test the complete browser workflow.
4. Test CSV upload using multiple formats.
5. Verify prediction and analytics through the live frontend.
6. Run the Docker backend build.
7. Push the final verified project to GitHub.

---

# 25. Design Scope

The application intentionally uses a dark-first visual design.

A light-theme toggle was not implemented because it would require a
separate light color system and broader component refactoring.

This is a deliberate scope decision rather than a missing core product
feature.

---

# 26. Final Project Status

The core SmartNotify AI product is implemented.

The remaining work is primarily final environment configuration,
end-to-end verification, Docker verification, documentation completion,
and repository submission.

The core classification workflow is:

CSV / Message
    ↓
Ingestion
    ↓
Feature Engineering
    ↓
Historical Retrieval
    ↓
Trust / Spam / Scam / Urgency Signals
    ↓
Decision Engine
    ↓
Notify / Digest / Mute
    ↓
Prediction + Explanation
    ↓
Analytics / Frontend