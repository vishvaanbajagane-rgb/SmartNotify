import { ScoreBar } from "@/components/shared/score-bar";
import { CHART_COLORS } from "@/lib/chart-colors";
import type { AnalyticsSummary } from "@/lib/types";

function interpretRisk(avgScam: number, avgSpam: number): string {
  if (avgScam >= 0.4 || avgSpam >= 0.4) {
    return "This dataset skews risky — a large share of messages carry scam or spam signals.";
  }
  if (avgScam >= 0.2 || avgSpam >= 0.2) {
    return "Moderate risk overall, with a meaningful minority of flagged messages.";
  }
  return "Low risk overall — most messages are routine, everyday conversation.";
}

export function RiskSummary({ data }: { data: AnalyticsSummary }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h2 className="mb-1 text-sm font-medium text-text-primary">Risk summary</h2>
      <p className="mb-4 text-xs text-text-muted">
        {interpretRisk(data.avg_scam_probability, data.avg_spam_probability)}
      </p>

      <div className="flex flex-col gap-4">
        <ScoreBar label="Avg. confidence" value={data.avg_confidence} color={CHART_COLORS.muted} />
        <ScoreBar label="Avg. scam risk" value={data.avg_scam_probability} color={CHART_COLORS.mute} />
        <ScoreBar label="Avg. spam risk" value={data.avg_spam_probability} color={CHART_COLORS.digest} />
      </div>
    </div>
  );
}
