"use client";

import { ActionBadge } from "./action-badge";
import type { Prediction } from "@/lib/types";

export interface PredictionRow extends Prediction {
  sender_name: string;
  content: string;
}

interface PredictionTableProps {
  rows: PredictionRow[];
  onSelect: (row: PredictionRow) => void;
}

export function PredictionTable({ rows, onSelect }: PredictionTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface py-16 text-center text-sm text-text-muted">
        No predictions yet — predict a message above or run batch predict.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-text-muted">
            <th className="px-4 py-3 font-medium">Sender</th>
            <th className="px-4 py-3 font-medium">Message</th>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">Confidence</th>
            <th className="px-4 py-3 font-medium">Scam</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.message_id}
              onClick={() => onSelect(row)}
              className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-raised"
            >
              <td className="max-w-[140px] truncate px-4 py-3 text-text-primary">
                {row.sender_name}
              </td>
              <td className="max-w-[280px] truncate px-4 py-3 text-text-muted">{row.content}</td>
              <td className="px-4 py-3">
                <ActionBadge action={row.action} />
              </td>
              <td className="px-4 py-3 font-mono text-xs text-text-muted">
                {Math.round(row.confidence_score * 100)}%
              </td>
              <td className="px-4 py-3 font-mono text-xs text-text-muted">
                {Math.round(row.scam_probability * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
