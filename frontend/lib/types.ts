// Mirrors backend/app/models/schemas.py — keep these in sync.

export type Action = "Notify" | "Digest" | "Mute";
export type SenderType = "contact" | "business" | "group";
export type MessageType = "text" | "image" | "voice";

export interface Message {
  id: string;
  content: string;
  message_type: MessageType;
  group_name: string | null;
  media_url: string | null;
  forward_count: number;
  sender_id: string;
  timestamp: string;
}

export interface Prediction {
  message_id: string;
  action: Action;
  reason: string;
  confidence_score: number;
  evidence_message_ids: string[];
  business_trust_score: number;
  spam_probability: number;
  scam_probability: number;
  urgency_score: number;
}

export interface PredictionRequest {
  content: string;
  sender_name: string;
  sender_type: SenderType;
  message_type?: MessageType;
  group_name?: string | null;
  forward_count?: number;
}

export interface BatchPredictResponse {
  total_processed: number;
  predictions: Prediction[];
}

export interface UploadResponse {
  filename: string;
  rows_ingested: number;
  rows_skipped: number;
  message: string;
}

export interface MessageFeatures {
  message_id: string;
  text_length: number;
  word_count: number;
  exclamation_count: number;
  question_count: number;
  caps_ratio: number;
  digit_ratio: number;
  has_url: boolean;
  url_count: number;
  has_phone_number: boolean;
  has_currency_symbol: boolean;
  urgency_keyword_count: number;
  scam_keyword_count: number;
  spam_keyword_count: number;
  sender_type: string;
  is_group_message: boolean;
  is_business_sender: boolean;
  is_verified_business: boolean;
  sender_trust_score: number;
  forward_count: number;
  message_type: string;
  hour_of_day: number;
  is_late_night: boolean;
}

export interface SimilarMessage {
  message_id: string;
  content: string;
  similarity: number;
  past_action: Action | null;
}

export interface SenderTrust {
  sender_id: string;
  sender_name: string;
  trust_score: number;
  message_count: number;
  mute_rate: number;
  notify_rate: number;
  basis: "verified" | "learned" | "default";
}

export interface OCRResult {
  extracted_text: string;
  detected_language: string | null;
  confidence: number;
}

export interface TranscriptionResult {
  transcript: string;
  language: string;
  duration_seconds: number;
}

export interface ImageAnalysisResponse {
  message_id: string;
  ocr: OCRResult;
  action: Action;
  reason: string;
  confidence_score: number;
  scam_probability: number;
  spam_probability: number;
  urgency_score: number;
}

export interface VoiceAnalysisResponse {
  message_id: string;
  transcription: TranscriptionResult;
  action: Action;
  reason: string;
  confidence_score: number;
  scam_probability: number;
  spam_probability: number;
  urgency_score: number;
}

export interface ActionBreakdown {
  Notify: number;
  Digest: number;
  Mute: number;
}

export interface MessageTypeBreakdown {
  text: number;
  image: number;
  voice: number;
}

export interface FlaggedSender {
  sender: string;
  scam_probability: number;
}

export interface DailyActionCount {
  date: string;
  Notify: number;
  Digest: number;
  Mute: number;
}

export interface AnalyticsSummary {
  total_messages: number;
  action_breakdown: ActionBreakdown;
  message_type_breakdown: MessageTypeBreakdown;
  avg_confidence: number;
  avg_scam_probability: number;
  avg_spam_probability: number;
  top_flagged_senders: FlaggedSender[];
  daily_action_counts: DailyActionCount[];
}

// --- Auth ---

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}