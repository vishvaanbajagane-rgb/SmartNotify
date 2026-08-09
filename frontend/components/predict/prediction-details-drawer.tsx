"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ActionBadge } from "./action-badge";
import type { PredictionRow } from "./prediction-table";
import { ScoreBar } from "@/components/shared/score-bar";
import { CHART_COLORS } from "@/lib/chart-colors";

interface PredictionDetailsDrawerProps {
  row: PredictionRow | null;
  onClose: () => void;
}

export function PredictionDetailsDrawer({ row, onClose }: PredictionDetailsDrawerProps) {
  return (
    <AnimatePresence>
      {row && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-muted">Prediction details</p>
                <p className="mt-1 font-display text-lg font-bold text-text-primary">
                  {row.sender_name}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close details"
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-raised hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <ActionBadge action={row.action} />
            </div>

            <div className="mt-4 rounded-lg border border-border bg-ink p-3">
              <p className="text-sm text-text-primary">{row.content}</p>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-ink p-3">
              <p className="mb-1 text-xs text-text-muted">Reason</p>
              <p className="font-mono text-sm text-text-primary">{row.reason}</p>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <ScoreBar label="Confidence" value={row.confidence_score} color={CHART_COLORS.muted} />
              <ScoreBar label="Urgency" value={row.urgency_score} color={CHART_COLORS.digest} />
              <ScoreBar label="Scam risk" value={row.scam_probability} color={CHART_COLORS.mute} />
              <ScoreBar label="Spam risk" value={row.spam_probability} color={CHART_COLORS.digest} />
              <ScoreBar
                label="Business trust"
                value={row.business_trust_score}
                color={CHART_COLORS.notify}
              />
            </div>

            {row.evidence_message_ids.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-xs text-text-muted">
                  Similar past messages considered ({row.evidence_message_ids.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {row.evidence_message_ids.map((id) => (
                    <span
                      key={id}
                      className="rounded-full bg-surface-raised px-2 py-1 font-mono text-[11px] text-text-muted"
                    >
                      {id.slice(0, 8)}…
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
