"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, PlayCircle } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { PredictionForm } from "@/components/predict/prediction-form";
import { PredictionTable, type PredictionRow } from "@/components/predict/prediction-table";
import { PredictionDetailsDrawer } from "@/components/predict/prediction-details-drawer";
import { listMessages, predictBatch, ApiError } from "@/lib/api";
import type { Prediction } from "@/lib/types";

export default function PredictPage() {
  const [rows, setRows] = useState<PredictionRow[]>([]);
  const [selected, setSelected] = useState<PredictionRow | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSingleResult(prediction: Prediction, meta: { sender_name: string; content: string }) {
    const row: PredictionRow = { ...prediction, ...meta };
    setRows((prev) => [row, ...prev]);
    setSelected(row);
  }

  async function handleBatchPredict() {
    setBatchLoading(true);
    setError(null);
    try {
      const [messages, batchResult] = await Promise.all([listMessages(200), predictBatch()]);
      const messageById = new Map(messages.map((m) => [m.id, m]));

      const newRows: PredictionRow[] = batchResult.predictions.map((p) => {
        const message = messageById.get(p.message_id);
        return {
          ...p,
          sender_name: message?.sender_name ?? "Unknown",
          content: message?.content ?? "",
        };
      });
      setRows(newRows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the backend.");
    } finally {
      setBatchLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Predict</h1>
            <p className="mt-1 text-sm text-text-muted">
              Classify a single message, or run every ingested message through the decision engine.
            </p>
          </div>
          <button
            onClick={handleBatchPredict}
            disabled={batchLoading}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-text-primary transition-colors hover:bg-surface disabled:opacity-50"
          >
            {batchLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            {batchLoading ? "Running…" : "Run batch predict"}
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-card border border-mute/30 bg-mute-dim/40 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-mute" />
            <p className="text-sm text-text-muted">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <PredictionForm onResult={handleSingleResult} />
        </div>

        <PredictionTable rows={rows} onSelect={setSelected} />
      </div>

      <PredictionDetailsDrawer row={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
