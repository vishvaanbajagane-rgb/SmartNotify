# Multi-stage build: build-only tools (gcc, g++) are needed to compile some
# packages' C extensions but bloat the final image if left in it. The
# runtime stage only carries what's needed to actually run the app.

FROM python:3.11-slim AS builder

WORKDIR /app

# Build-time system deps (compilers for packages with C extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt


FROM python:3.11-slim

WORKDIR /app

# Runtime-only system deps (no compilers — ffmpeg for Whisper, libgl/glib for OpenCV)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
