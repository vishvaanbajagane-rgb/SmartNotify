// Recharts needs real hex values, not Tailwind classes — these MUST stay
// in sync with the `notify` / `digest` / `mute` colors in tailwind.config.ts.
export const CHART_COLORS = {
  notify: "#22D3A6",
  digest: "#F5A524",
  mute: "#FB5B6E",
  muted: "#8B96A8",
  border: "#2A3344",
} as const;

export const ACTION_COLORS: Record<"Notify" | "Digest" | "Mute", string> = {
  Notify: CHART_COLORS.notify,
  Digest: CHART_COLORS.digest,
  Mute: CHART_COLORS.mute,
};