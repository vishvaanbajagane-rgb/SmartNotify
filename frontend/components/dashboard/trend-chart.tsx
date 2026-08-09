"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyActionCount } from "@/lib/types";
import { CHART_COLORS } from "@/lib/chart-colors";

interface TrendChartProps {
  data: DailyActionCount[];
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-text-muted">
        No trend data yet
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="notifyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.notify} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.notify} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="digestGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.digest} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.digest} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="muteGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.mute} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.mute} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_COLORS.border} vertical={false} />
          <XAxis
            dataKey="date"
            stroke={CHART_COLORS.muted}
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis stroke={CHART_COLORS.muted} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "#171E2C",
              border: "1px solid #2A3344",
              borderRadius: 8,
              fontSize: 13,
            }}
            itemStyle={{ color: "#E7ECF3" }}
            labelStyle={{ color: "#8B96A8" }}
          />
          <Area type="monotone" dataKey="Notify" stackId="1" stroke={CHART_COLORS.notify} fill="url(#notifyGradient)" strokeWidth={2} />
          <Area type="monotone" dataKey="Digest" stackId="1" stroke={CHART_COLORS.digest} fill="url(#digestGradient)" strokeWidth={2} />
          <Area type="monotone" dataKey="Mute" stackId="1" stroke={CHART_COLORS.mute} fill="url(#muteGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
