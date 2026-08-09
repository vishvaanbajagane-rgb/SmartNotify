# SmartNotify AI — Complete Project Startup Guide

This file explains how to run the complete SmartNotify AI project locally from VS Code.

Project structure:

SmartNotify/
├── backend/
├── frontend/
├── docker-compose.yml
├── README.md
└── START_PROJECT.md

---

# 1. Requirements

Make sure these are installed:

- Python 3.12 or compatible supported version
- Node.js
- npm
- Docker Desktop
- VS Code

Check:

```powershell
python --version
node --version
npm --version
docker --version
docker compose version
```

Docker Desktop must be running before starting PostgreSQL.

---

# 2. Open the Project in VS Code

Open:

```text
D:\SmartNotifyAI-Project\SmartNotify
```

The VS Code terminal should start in:

```text
PS D:\SmartNotifyAI-Project\SmartNotify>
```

If not:

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify
```

---

# 3. Start Docker Desktop

Open Docker Desktop manually.

Wait until Docker Desktop shows that Docker is running.

Verify:

```powershell
docker --version
```

Then:

```powershell
docker compose version
```

---

# 4. Start PostgreSQL Using Docker

The project already contains:

```text
docker-compose.yml
```

The PostgreSQL service is called:

```text
db
```

Start PostgreSQL:

```powershell
docker compose up -d db
```

Check the container:

```powershell
docker compose ps
```

Expected result:

```text
smartnotify-db-1    postgres:16-alpine    ...    Up ... (healthy)
```

The PostgreSQL database uses:

```text
Database: smartnotify
Username: postgres
Password: postgres
Host: localhost
Port: 5432
```

Database URL for running the backend directly from Windows:

```text
postgresql://postgres:postgres@localhost:5432/smartnotify
```

IMPORTANT:

When the backend runs directly from Windows, use:

```text
localhost
```

When the backend runs inside Docker Compose, use:

```text
db
```

---

# 5. Backend Environment

Open:

```text
backend/.env
```

Make sure the database URL is correct for running the backend directly from VS Code:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartnotify
```

Also make sure the required backend environment variables exist.

Example:

```env
ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartnotify

CORS_ORIGINS=http://localhost:3000

JWT_SECRET_KEY=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET

DATASET_PATH=dataset/messages.csv

OUTPUT_PATH=output/output.csv

ML_MODELS_DIR=ml_models

FAISS_INDEX_PATH=ml_models/faiss_index.bin

SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2

WHISPER_MODEL_SIZE=base

NOTIFY_CONFIDENCE_THRESHOLD=0.65

SCAM_BLOCK_THRESHOLD=0.75

OPENAI_API_KEY=

GOOGLE_APPLICATION_CREDENTIALS=
```

Do not commit the real `.env` file to GitHub.

---

# 6. Activate the Python Virtual Environment

The project virtual environment is:

```text
D:\SmartNotifyAI-Project\.venv
```

From the project root:

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

After activation, the terminal should look similar to:

```text
(.venv) PS D:\SmartNotifyAI-Project\SmartNotify>
```

If PowerShell blocks activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

Then:

```powershell
.\.venv\Scripts\Activate.ps1
```

---

# 7. Go to Backend

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\backend
```

Verify:

```powershell
Get-ChildItem
```

You should see the backend files and folders, including:

```text
app
requirements.txt
Dockerfile
.env
```

---

# 8. Install Backend Dependencies

Run:

```powershell
python -m pip install -r requirements.txt
```

If dependencies are already installed, this command is safe to run again.

Verify important packages:

```powershell
python -c "import fastapi, sqlalchemy, psycopg2, pandas; print('Backend dependencies OK')"
```

---

# 9. Verify PostgreSQL Connection

Make sure PostgreSQL Docker container is running first.

From:

```text
D:\SmartNotifyAI-Project\SmartNotify\backend
```

run:

```powershell
python -c "from app.db.session import engine; conn=engine.connect(); print('PostgreSQL connection OK'); conn.close()"
```

Expected:

```text
PostgreSQL connection OK
```

If you get:

```text
could not translate host name "db"
```

your backend is trying to connect to Docker's internal hostname.

For running the backend directly from VS Code, change:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartnotify
```

Then run the connection test again.

---

# 10. Start the Backend

Stay inside:

```text
D:\SmartNotifyAI-Project\SmartNotify\backend
```

Run:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

Expected:

```text
Uvicorn running on http://127.0.0.1:8000
Application startup complete.
```

DO NOT close this terminal.

The backend is now running at:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

Open the Swagger page in your browser:

```text
http://127.0.0.1:8000/docs
```

---

# 11. Open a Second VS Code Terminal

Do NOT stop the backend.

In VS Code:

```text
Terminal → New Terminal
```

You should now have:

Terminal 1:
```text
Backend
```

Terminal 2:
```text
Frontend
```

---

# 12. Go to Frontend

In Terminal 2:

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\frontend
```

Verify:

```powershell
Get-ChildItem
```

You should see files such as:

```text
app
components
public
package.json
next.config.*
tsconfig.json
```

---

# 13. Install Frontend Dependencies

Run:

```powershell
npm install
```

If dependencies are already installed, npm will simply verify/update them.

---

# 14. Configure Frontend Environment

Check whether this file exists:

```text
frontend/.env.local
```

If it does not exist, create:

```text
frontend/.env.local
```

Put the frontend backend URL inside:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Save the file.

---

# 15. Start the Frontend

From:

```text
D:\SmartNotifyAI-Project\SmartNotify\frontend
```

run:

```powershell
npm run dev
```

Expected:

```text
Ready
Local: http://localhost:3000
```

The frontend is now running at:

```text
http://localhost:3000
```

Open:

```text
http://localhost:3000
```

---

# 16. Complete Running Setup

At this point you should have THREE things running:

## Docker PostgreSQL

Terminal:

```text
smartnotify-db-1
```

Check:

```powershell
docker compose ps
```

Expected:

```text
smartnotify-db-1    postgres:16-alpine    Up ... (healthy)
```

---

## Backend

Terminal 1:

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\backend
python -m uvicorn app.main:app --reload --port 8000
```

URL:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

---

## Frontend

Terminal 2:

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\frontend
npm run dev
```

URL:

```text
http://localhost:3000
```

---

# 17. Recommended VS Code Terminal Layout

Use three terminals.

## Terminal 1 — Docker / PostgreSQL

From project root:

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify
docker compose up -d db
docker compose ps
```

Keep Docker Desktop running.

---

## Terminal 2 — Backend

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

---

## Terminal 3 — Frontend

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\frontend
npm run dev
```

---

# 18. Test the Complete Application

Open:

```text
http://localhost:3000
```

The SmartNotify AI landing page should load.

Then test the application pages.

Backend API:

```text
http://localhost:8000/docs
```

Database:

```text
PostgreSQL
localhost:5432
```

---

# 19. Test CSV Upload

The project accepts CSV files related to message data.

The ingestion service automatically detects common column names.

Examples of accepted sender columns:

```text
sender
sender_name
from
contact
name
author
phone
phone_number
number
username
user
sender_phone
```

Examples of accepted message columns:

```text
content
message
text
message_content
body
msg
description
text_content
sms_body
message_text
```

Examples:

```csv
sender,content
John,Hello how are you?
Priya,Your meeting is at 5 PM
Bank,Your OTP is 482910
```

Or:

```csv
Phone Number,Message,Date
9876543210,Your OTP is 123456,2026-08-07
9876501234,Hello there,2026-08-07
```

Or:

```csv
From,Body,SentAt
John,Hello,2026-08-07
Bank,Your payment was successful,2026-08-07
```

Column names are normalized so variations such as:

```text
Phone Number
phone-number
phone_number
```

can resolve to the same field.

---

# 20. Important CSV Rule

The CSV must contain at least:

```text
Sender
Message Content
```

The actual column names do not have to be exactly those names because the ingestion service supports aliases.

Optional fields include:

```text
sender_type
message_type
group_name
media_url
forward_count
timestamp
is_verified_business
```

Extra irrelevant columns are allowed.

Rows missing the required sender or message content are skipped and reported instead of crashing the complete upload.

---

# 21. Stop the Backend

In the backend terminal press:

```text
CTRL + C
```

---

# 22. Stop the Frontend

In the frontend terminal press:

```text
CTRL + C
```

---

# 23. Stop PostgreSQL

From the project root:

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify
docker compose stop db
```

This stops PostgreSQL but keeps the Docker volume.

---

# 24. Start Everything Again Later

When you want to work on the project again:

## Terminal 1

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify
docker compose up -d db
docker compose ps
```

## Terminal 2

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

## Terminal 3

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\frontend
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

# 25. Full Quick Start

If everything is already configured, use these commands.

## Terminal 1

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify
docker compose up -d db
docker compose ps
```

## Terminal 2

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

## Terminal 3

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\frontend
npm run dev
```

Then open:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

---

# 26. Troubleshooting

## Docker command not recognized

If:

```powershell
docker --version
```

does not work:

1. Open Docker Desktop.
2. Wait until Docker is running.
3. Close the VS Code terminal.
4. Open a NEW VS Code terminal.
5. Run:

```powershell
docker --version
```

If Docker was installed per-user, its executable may be located under:

```text
%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin
```

---

## Docker PostgreSQL is not running

Run:

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify
docker compose up -d db
docker compose ps
```

The database should show:

```text
healthy
```

---

## Python says No module named app

Make sure you are inside:

```text
D:\SmartNotifyAI-Project\SmartNotify\backend
```

Then run:

```powershell
python -c "from app.main import app; print('FastAPI application OK')"
```

---

## SQLAlchemy is missing

Activate the virtual environment:

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\backend
.\.venv\Scripts\Activate.ps1
```

Then:

```powershell
python -m pip install -r requirements.txt
```

---

## PostgreSQL connection error

Check:

```powershell
docker compose ps
```

Then verify:

```powershell
python -c "from app.db.session import engine; conn=engine.connect(); print('PostgreSQL connection OK'); conn.close()"
```

For backend running directly from Windows, `.env` should use:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartnotify
```

---

## Port 5432 already in use

Check:

```powershell
netstat -ano | findstr :5432
```

If another PostgreSQL installation is using port 5432, stop that service or change the Docker port mapping.

---

## Port 8000 already in use

Use:

```powershell
python -m uvicorn app.main:app --reload --port 8001
```

Then update the frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## Port 3000 already in use

Next.js may automatically choose another port.

For example:

```text
http://localhost:3001
```

Use the URL shown in the terminal.

---

# 27. Docker Backend Option

The project also contains a Docker configuration for the backend.

To run both PostgreSQL and backend using Docker Compose:

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify
docker compose up -d --build
```

Check:

```powershell
docker compose ps
```

Expected services:

```text
db
backend
```

IMPORTANT:

When backend runs inside Docker Compose, its database hostname must be:

```text
db
```

not:

```text
localhost
```

Therefore Docker backend configuration should use:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/smartnotify
```

When running backend directly from Windows, use:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartnotify
```

---

# 28. Recommended Development Method

For normal development, use:

```text
Docker
  ↓
PostgreSQL

Backend
  ↓
FastAPI + Uvicorn

Frontend
  ↓
Next.js
```

Recommended commands:

```powershell
# Terminal 1
cd D:\SmartNotifyAI-Project\SmartNotify
docker compose up -d db
```

```powershell
# Terminal 2
cd D:\SmartNotifyAI-Project\SmartNotify\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

```powershell
# Terminal 3
cd D:\SmartNotifyAI-Project\SmartNotify\frontend
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 29. Final Architecture

```text
                    SMARTNOTIFY AI
                         │
                         ▼
                 ┌───────────────┐
                 │   Next.js     │
                 │   Frontend    │
                 │ localhost:3000│
                 └───────┬───────┘
                         │
                         │ HTTP API
                         ▼
                 ┌───────────────┐
                 │    FastAPI    │
                 │    Backend    │
                 │ localhost:8000│
                 └───────┬───────┘
                         │
                         │ SQLAlchemy
                         ▼
                 ┌───────────────┐
                 │  PostgreSQL   │
                 │    Docker     │
                 │ localhost:5432│
                 └───────────────┘
```

---

# 30. Final Verification Checklist

Before considering the local project ready:

```text
[ ] Docker Desktop running
[ ] docker --version works
[ ] docker compose version works
[ ] PostgreSQL container running
[ ] PostgreSQL container healthy
[ ] Python virtual environment activated
[ ] Backend dependencies installed
[ ] PostgreSQL connection OK
[ ] FastAPI starts successfully
[ ] http://localhost:8000/docs opens
[ ] Frontend dependencies installed
[ ] npm run dev works
[ ] http://localhost:3000 opens
[ ] Frontend can communicate with backend
[ ] CSV upload works
[ ] CSV ingestion works
[ ] Predictions are generated
[ ] Analytics page loads
[ ] Docker Compose configuration is valid
```

---

# Quick Commands

### Start PostgreSQL

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify
docker compose up -d db
```

### Check PostgreSQL

```powershell
docker compose ps
```

### Start Backend

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

### Start Frontend

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify\frontend
npm run dev
```

### Open Application

```text
http://localhost:3000
```

### Open Backend API

```text
http://localhost:8000/docs
```

### Stop PostgreSQL

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify
docker compose stop db
```

### Stop all Docker services

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify
docker compose down
```

### Start Docker services again

```powershell
cd D:\SmartNotifyAI-Project\SmartNotify
docker compose up -d --build
```

---

# SmartNotify AI — Local Development Ready

The normal development workflow is:

1. Start Docker Desktop.
2. Start PostgreSQL with Docker Compose.
3. Start FastAPI backend.
4. Start Next.js frontend.

6. Use the application.
7. Stop frontend/backend with `CTRL+C`.
8. Stop PostgreSQL with `docker compose stop db`.

Do not delete the Docker volume unless you intentionally want to delete the PostgreSQL data.