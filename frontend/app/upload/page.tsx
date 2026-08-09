"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Dropzone } from "@/components/upload/dropzone";
import { MessagePreviewTable } from "@/components/upload/message-preview-table";
import { uploadDataset, listMessages, ApiError } from "@/lib/api";
import type { Message, UploadResponse } from "@/lib/types";

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const uploadResult = await uploadDataset(file);
      setResult(uploadResult);
      const ingested = await listMessages(200);
      setMessages(ingested);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the backend.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-text-primary">Upload dataset</h1>
          <p className="mt-1 text-sm text-text-muted">
            Ingest a messages.csv to populate SmartNotify AI. Column names are
            auto-detected — sender and content are the only required fields.
          </p>
        </div>

        <Dropzone onUpload={handleUpload} uploading={uploading} />

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-card border border-mute/30 bg-mute-dim/40 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-mute" />
            <p className="text-sm text-text-muted">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 flex items-start justify-between gap-4 rounded-card border border-notify/30 bg-notify-dim/40 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-notify" />
              <div>
                <p className="text-sm font-medium text-text-primary">{result.message}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {result.rows_ingested} ingested
                  {result.rows_skipped > 0 && `, ${result.rows_skipped} skipped`} from{" "}
                  {result.filename}
                </p>
              </div>
            </div>
            <Link
              href="/predict"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-notify px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90"
            >
              Run predictions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {messages.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-text-primary">
              Ingested messages ({messages.length})
            </h2>
            <MessagePreviewTable messages={messages} />
          </div>
        )}
      </div>
    </main>
  );
}
