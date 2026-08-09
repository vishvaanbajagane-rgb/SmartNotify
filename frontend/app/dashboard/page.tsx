"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Inbox,
  ShieldOff,
  Upload,
} from "lucide-react";

import { Navbar } from "@/components/shared/navbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActionBreakdownChart } from "@/components/dashboard/action-breakdown-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { FlaggedSendersList } from "@/components/dashboard/flagged-senders-list";

import { getAnalytics, ApiError } from "@/lib/api";
import type { AnalyticsSummary } from "@/lib/types";

import { DownloadReportButton } from "@/components/shared/download-report-button";
import { useDatasetSession } from "@/components/shared/dataset-session-provider";

export default function DashboardPage() {
  const { datasetUploaded } = useDatasetSession();

  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Do not contact the backend if the user has not uploaded
    // a dataset during this browser session.
    if (!datasetUploaded) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getAnalytics()
      .then(setData)
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Could not reach the backend. Is it running?");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [datasetUploaded]);

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-text-muted">
              Live overview of every message SmartNotify AI has triaged.
            </p>
          </div>

          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-text-primary transition-colors hover:bg-surface"
          >
            <Upload className="h-4 w-4" />
            Upload dataset
          </Link>
        </div>

        {/* --------------------------------------------- */}
        {/* NO DATASET UPLOADED IN CURRENT SESSION        */}
        {/* --------------------------------------------- */}

        {!datasetUploaded && (
          <div className="flex flex-col items-center gap-4 rounded-card border border-border bg-surface py-20 text-center">
            <Inbox className="h-10 w-10 text-text-muted" />

            <div>
              <p className="text-lg font-medium text-text-primary">
                No dataset uploaded
              </p>

              <p className="mt-2 max-w-md text-sm text-text-muted">
                Upload your messages.csv dataset to generate predictions,
                analytics, and the downloadable progress report.
              </p>
            </div>

            <Link
              href="/upload"
              className="mt-2 flex items-center gap-2 rounded-full bg-notify px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
            >
              <Upload className="h-4 w-4" />
              Upload dataset
            </Link>
          </div>
        )}

        {/* --------------------------------------------- */}
        {/* LOADING                                      */}
        {/* --------------------------------------------- */}

        {datasetUploaded && loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-card border border-border bg-surface"
              />
            ))}
          </div>
        )}

        {/* --------------------------------------------- */}
        {/* ERROR                                        */}
        {/* --------------------------------------------- */}

        {datasetUploaded && !loading && error && (
          <div className="flex items-start gap-3 rounded-card border border-mute/30 bg-mute-dim/40 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-mute" />

            <div>
              <p className="text-sm font-medium text-text-primary">
                Couldn&apos;t load analytics
              </p>

              <p className="mt-1 text-sm text-text-muted">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* --------------------------------------------- */}
        {/* DATASET UPLOADED BUT NO PREDICTIONS           */}
        {/* --------------------------------------------- */}

        {datasetUploaded &&
          !loading &&
          !error &&
          data &&
          data.total_messages === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface py-16 text-center">
              <Inbox className="h-8 w-8 text-text-muted" />

              <p className="text-text-primary">
                No predictions available
              </p>

              <p className="max-w-sm text-sm text-text-muted">
                Upload the dataset and run prediction to generate the
                SmartNotify AI report.
              </p>
            </div>
          )}

        {/* --------------------------------------------- */}
        {/* ANALYTICS                                    */}
        {/* --------------------------------------------- */}

        {datasetUploaded &&
          !loading &&
          !error &&
          data &&
          data.total_messages > 0 && (
            <div className="flex flex-col gap-6">
              {/* Summary cards */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total messages"
                  value={data.total_messages}
                  icon={Inbox}
                />

                <StatCard
                  label="Notified"
                  value={data.action_breakdown.Notify}
                  icon={Bell}
                  accentClassName="text-notify"
                />

                <StatCard
                  label="Digested"
                  value={data.action_breakdown.Digest}
                  icon={Inbox}
                  accentClassName="text-digest"
                />

                <StatCard
                  label="Muted"
                  value={data.action_breakdown.Mute}
                  icon={ShieldOff}
                  accentClassName="text-mute"
                />
              </div>

              {/* Risk cards */}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <StatCard
                  label="Avg. confidence"
                  value={`${Math.round(
                    data.avg_confidence * 100
                  )}%`}
                  sublabel="How decisive the signal set was, on average"
                />

                <StatCard
                  label="Avg. scam risk"
                  value={`${Math.round(
                    data.avg_scam_probability * 100
                  )}%`}
                  accentClassName="text-mute"
                />

                <StatCard
                  label="Avg. spam risk"
                  value={`${Math.round(
                    data.avg_spam_probability * 100
                  )}%`}
                  accentClassName="text-digest"
                />
              </div>

              {/* Charts */}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-card border border-border bg-surface p-5 lg:col-span-1">
                  <h2 className="mb-3 text-sm font-medium text-text-primary">
                    Action breakdown
                  </h2>

                  <ActionBreakdownChart
                    breakdown={data.action_breakdown}
                  />
                </div>

                <div className="rounded-card border border-border bg-surface p-5 lg:col-span-2">
                  <h2 className="mb-3 text-sm font-medium text-text-primary">
                    Daily trend
                  </h2>

                  <TrendChart data={data.daily_action_counts} />
                </div>
              </div>

              {/* Flagged senders */}

              <div className="rounded-card border border-border bg-surface p-5">
                <h2 className="mb-4 text-sm font-medium text-text-primary">
                  Top flagged senders
                </h2>

                <FlaggedSendersList
                  senders={data.top_flagged_senders}
                />
              </div>

              {/* Download report */}

              <div className="flex justify-end">
                <DownloadReportButton />
              </div>
            </div>
          )}
      </div>
    </main>
  );
}