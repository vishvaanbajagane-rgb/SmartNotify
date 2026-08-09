"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { SenderFields } from "@/components/shared/sender-fields";
import { ImageDropzone } from "@/components/image-analysis/image-dropzone";
import { ImageResultCard } from "@/components/image-analysis/image-result-card";
import { analyzeImage, ApiError } from "@/lib/api";
import type { ImageAnalysisResponse, SenderType } from "@/lib/types";

export default function ImageAnalysisPage() {
  const [senderName, setSenderName] = useState("");
  const [senderType, setSenderType] = useState<SenderType>("contact");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(file: File) {
    if (!senderName.trim()) {
      setError("Enter a sender name before analyzing.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const response = await analyzeImage(file, senderName, senderType);
      setResult(response);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setError(
          "OCR model isn't downloaded yet on the backend — it needs internet on first run. Try again in a moment."
        );
      } else if (err instanceof ApiError && err.status === 422) {
        setError("No readable text was found in that image.");
      } else {
        setError(err instanceof ApiError ? err.message : "Could not reach the backend.");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-text-primary">Image analysis</h1>
          <p className="mt-1 text-sm text-text-muted">
            Upload a screenshot or forwarded image — OCR extracts the text, then it's
            routed through the same decision engine as any other message.
          </p>
        </div>

        <div className="mb-4">
          <SenderFields
            senderName={senderName}
            onSenderNameChange={setSenderName}
            senderType={senderType}
            onSenderTypeChange={setSenderType}
          />
        </div>

        <ImageDropzone onAnalyze={handleAnalyze} analyzing={analyzing} />

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-card border border-mute/30 bg-mute-dim/40 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-mute" />
            <p className="text-sm text-text-muted">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6">
            <ImageResultCard result={result} />
          </div>
        )}
      </div>
    </main>
  );
}
