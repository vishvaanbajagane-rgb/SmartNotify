import { ScanText } from "lucide-react";
import { ActionBadge } from "@/components/predict/action-badge";
import { ScoreBar } from "@/components/shared/score-bar";
import { CHART_COLORS } from "@/lib/chart-colors";
import type { ImageAnalysisResponse } from "@/lib/types";

export function ImageResultCard({ result }: { result: ImageAnalysisResponse }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-text-primary">Analysis result</h2>
        <ActionBadge action={result.action} />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-ink p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-text-muted">
          <ScanText className="h-3.5 w-3.5" />
          OCR extracted text (confidence {Math.round(result.ocr.confidence * 100)}%)
        </div>
        <p className="text-sm text-text-primary">
          {result.ocr.extracted_text || (
            <span className="text-text-muted">No text detected in this image.</span>
          )}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-ink p-3">
        <p className="mb-1 text-xs text-text-muted">Reason</p>
        <p className="font-mono text-sm text-text-primary">{result.reason}</p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <ScoreBar label="Confidence" value={result.confidence_score} color={CHART_COLORS.muted} />
        <ScoreBar label="Urgency" value={result.urgency_score} color={CHART_COLORS.digest} />
        <ScoreBar label="Scam risk" value={result.scam_probability} color={CHART_COLORS.mute} />
        <ScoreBar label="Spam risk" value={result.spam_probability} color={CHART_COLORS.digest} />
      </div>
    </div>
  );
}
