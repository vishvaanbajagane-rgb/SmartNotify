"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Inbox, Upload } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { ActionBreakdownChart } from "@/components/dashboard/action-breakdown-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { FlaggedSendersList } from "@/components/dashboard/flagged-senders-list";
import { MessageTypeChart } from "@/components/analytics/message-type-chart";
import { RiskSummary } from "@/components/analytics/risk-summary";
import { getAnalytics, ApiError } from "@/lib/api";
import type { AnalyticsSummary } from "@/lib/types";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Could not reach the backend.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="mt-1 text-sm text-text-muted">
            A deeper breakdown of how SmartNotify AI has been routing messages.
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-card border border-border bg-surface" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-3 rounded-card border border-mute/30 bg-mute-dim/40 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-mute" />
            <p className="text-sm text-text-muted">{error}</p>
          </div>
        )}

        {!loading && !error && data && data.total_messages === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface py-16 text-center">
            <Inbox className="h-8 w-8 text-text-muted" />
            <p className="text-text-primary">No data to analyze yet</p>
            <p className="max-w-sm text-sm text-text-muted">
              Upload a dataset and run predictions to see analytics here.
            </p>
            <Link
              href="/upload"
              className="mt-2 flex items-center gap-2 rounded-full bg-notify px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90"
            >
              <Upload className="h-4 w-4" />
              Upload dataset
            </Link>
          </div>
        )}

        {!loading && !error && data && data.total_messages > 0 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-card border border-border bg-surface p-5">
                <h2 className="mb-3 text-sm font-medium text-text-primary">Action breakdown</h2>
                <ActionBreakdownChart breakdown={data.action_breakdown} />
              </div>

              <div className="rounded-card border border-border bg-surface p-5">
                <h2 className="mb-3 text-sm font-medium text-text-primary">Message types</h2>
                <MessageTypeChart breakdown={data.message_type_breakdown} />
              </div>
            </div>

            <div className="rounded-card border border-border bg-surface p-5">
              <h2 className="mb-3 text-sm font-medium text-text-primary">Daily trend</h2>
              <TrendChart data={data.daily_action_counts} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <RiskSummary data={data} />

              <div className="rounded-card border border-border bg-surface p-5">
                <h2 className="mb-4 text-sm font-medium text-text-primary">Top flagged senders</h2>
                <FlaggedSendersList senders={data.top_flagged_senders} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
