"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { SenderFields } from "@/components/shared/sender-fields";
import { AudioDropzone } from "@/components/voice-analysis/audio-dropzone";
import { VoiceResultCard } from "@/components/voice-analysis/voice-result-card";
import { analyzeVoice, ApiError } from "@/lib/api";
import type { VoiceAnalysisResponse, SenderType } from "@/lib/types";

export default function VoiceAnalysisPage() {
  const [senderName, setSenderName] = useState("");
  const [senderType, setSenderType] = useState<SenderType>("contact");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VoiceAnalysisResponse | null>(null);
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
      const response = await analyzeVoice(file, senderName, senderType);
      setResult(response);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setError(
          "Whisper model isn't downloaded yet on the backend — it needs internet on first run. Try again in a moment."
        );
      } else if (err instanceof ApiError && err.status === 422) {
        setError("No speech was detected in that audio file.");
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
          <h1 className="font-display text-2xl font-bold text-text-primary">Voice analysis</h1>
          <p className="mt-1 text-sm text-text-muted">
            Upload a voice note — Whisper transcribes it, then the transcript is
            routed through the same decision engine as a typed message.
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

        <AudioDropzone onAnalyze={handleAnalyze} analyzing={analyzing} />

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-card border border-mute/30 bg-mute-dim/40 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-mute" />
            <p className="text-sm text-text-muted">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6">
            <VoiceResultCard result={result} />
          </div>
        )}
      </div>
    </main>
  );
}
