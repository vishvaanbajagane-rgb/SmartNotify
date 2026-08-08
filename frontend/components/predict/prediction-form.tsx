"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { predictSingle, ApiError } from "@/lib/api";
import type { Prediction, SenderType, MessageType } from "@/lib/types";

interface PredictionFormProps {
  onResult: (prediction: Prediction, meta: { sender_name: string; content: string }) => void;
}

export function PredictionForm({ onResult }: PredictionFormProps) {
  const [content, setContent] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderType, setSenderType] = useState<SenderType>("contact");
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [forwardCount, setForwardCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !senderName.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const prediction = await predictSingle({
        content,
        sender_name: senderName,
        sender_type: senderType,
        message_type: messageType,
        forward_count: forwardCount,
      });
      onResult(prediction, { sender_name: senderName, content });
      setContent("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the backend.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-card border border-border bg-surface p-5">
      <h2 className="font-display text-sm font-bold text-text-primary">Predict a message</h2>
      <p className="mt-1 text-sm text-text-muted">
        Test the decision engine on any message without uploading a dataset.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <label htmlFor="content" className="mb-1.5 block text-xs text-text-muted">
            Message content
          </label>
          <textarea
            id="content"
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g. Your OTP is 482910, do not share it with anyone"
            className="w-full resize-none rounded-lg border border-border bg-ink px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-notify focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sender_name" className="mb-1.5 block text-xs text-text-muted">
              Sender name
            </label>
            <input
              id="sender_name"
              required
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. HDFC Bank"
              className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-notify focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="sender_type" className="mb-1.5 block text-xs text-text-muted">
              Sender type
            </label>
            <select
              id="sender_type"
              value={senderType}
              onChange={(e) => setSenderType(e.target.value as SenderType)}
              className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-text-primary focus:border-notify focus:outline-none"
            >
              <option value="contact">Contact</option>
              <option value="business">Business</option>
              <option value="group">Group</option>
            </select>
          </div>

          <div>
            <label htmlFor="message_type" className="mb-1.5 block text-xs text-text-muted">
              Message type
            </label>
            <select
              id="message_type"
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as MessageType)}
              className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-text-primary focus:border-notify focus:outline-none"
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="voice">Voice</option>
            </select>
          </div>

          <div>
            <label htmlFor="forward_count" className="mb-1.5 block text-xs text-text-muted">
              Forward count
            </label>
            <input
              id="forward_count"
              type="number"
              min={0}
              value={forwardCount}
              onChange={(e) => setForwardCount(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm text-text-primary focus:border-notify focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="text-sm text-mute">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-full bg-notify px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {submitting ? "Predicting…" : "Predict"}
        </button>
      </div>
    </form>
  );
}