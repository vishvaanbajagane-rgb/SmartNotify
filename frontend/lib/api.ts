import type {
  AnalyticsSummary,
  BatchPredictResponse,
  ImageAnalysisResponse,
  Message,
  MessageFeatures,
  Prediction,
  PredictionRequest,
  SenderTrust,
  SimilarMessage,
  TokenResponse,
  UploadResponse,
  User,
  VoiceAnalysisResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_PREFIX = "/api/v1";

const TOKEN_KEY = "smartnotify_access_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
  authenticated?: boolean;
  query?: Record<string, string | number | undefined>;
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData, authenticated = false, query } = options;

  let url = `${API_BASE_URL}${API_PREFIX}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  if (!formData) headers["Content-Type"] = "application/json";

  if (authenticated) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: formData ?? (body ? JSON.stringify(body) : undefined),
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const errorBody = await response.json();
      detail = errorBody.detail ?? detail;
    } catch {
      // response wasn't JSON, keep statusText
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// --- Auth ---

export const auth = {
  register: (email: string, password: string, fullName?: string) =>
    apiFetch<TokenResponse>("/auth/register", {
      method: "POST",
      body: { email, password, full_name: fullName },
    }),

  login: (email: string, password: string) =>
    apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  me: () => apiFetch<User>("/auth/me", { authenticated: true }),
};

// --- Dataset ingestion (Phase 3) ---

export function uploadDataset(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<UploadResponse>("/upload", { method: "POST", formData });
}

export function listMessages(limit = 100, offset = 0): Promise<Message[]> {
  return apiFetch<Message[]>("/messages", { query: { limit, offset } });
}

// --- Feature engineering (Phase 4) ---

export function getMessageFeatures(messageId: string): Promise<MessageFeatures> {
  return apiFetch<MessageFeatures>(`/features/${messageId}`);
}

export function getAllFeatures(): Promise<MessageFeatures[]> {
  return apiFetch<MessageFeatures[]>("/features");
}

// --- Prediction (Phase 5) ---

export function predictSingle(payload: PredictionRequest): Promise<Prediction> {
  return apiFetch<Prediction>("/predict", { method: "POST", body: payload });
}

export function predictBatch(): Promise<BatchPredictResponse> {
  return apiFetch<BatchPredictResponse>("/predict/batch", { method: "POST" });
}

export function getPrediction(messageId: string): Promise<Prediction> {
  return apiFetch<Prediction>(`/predict/${messageId}`);
}

export function getOutputCsvUrl(): string {
  return `${API_BASE_URL}${API_PREFIX}/export/output-csv`;
}

// --- Historical retrieval (Phase 6) ---

export function rebuildHistoricalIndex(): Promise<{ messages_indexed: number; message: string }> {
  return apiFetch("/historical/rebuild-index", { method: "POST" });
}

export function findSimilarMessages(content: string, topK = 5): Promise<SimilarMessage[]> {
  return apiFetch<SimilarMessage[]>("/historical/similar", { query: { content, top_k: topK } });
}

// --- Business trust (Phase 7) ---

export function getSenderTrust(senderId: string): Promise<SenderTrust> {
  return apiFetch<SenderTrust>(`/trust/${senderId}`);
}

// --- Spam / Scam detection (Phases 8-9) ---

export function checkSpam(content: string): Promise<{ content: string; ml_spam_probability: number }> {
  return apiFetch("/spam-check", { query: { content } });
}

export function checkScam(content: string): Promise<{ content: string; ml_scam_probability: number }> {
  return apiFetch("/scam-check", { query: { content } });
}

// --- Image / Voice analysis (Phases 10-11) ---

export function analyzeImage(
  file: File,
  senderName: string,
  senderType: string = "contact"
): Promise<ImageAnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sender_name", senderName);
  formData.append("sender_type", senderType);
  return apiFetch<ImageAnalysisResponse>("/analyze/image", { method: "POST", formData });
}

export function analyzeVoice(
  file: File,
  senderName: string,
  senderType: string = "contact"
): Promise<VoiceAnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sender_name", senderName);
  formData.append("sender_type", senderType);
  return apiFetch<VoiceAnalysisResponse>("/analyze/voice", { method: "POST", formData });
}

// --- Analytics (Phase 12) ---

export function getAnalytics(): Promise<AnalyticsSummary> {
  return apiFetch<AnalyticsSummary>("/analytics");
}