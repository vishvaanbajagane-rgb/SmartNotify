"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileText, Image as ImageIcon, Mic } from "lucide-react";
import type { MessageTypeBreakdown } from "@/lib/types";
import { CHART_COLORS } from "@/lib/chart-colors";

const TYPE_META = [
  { key: "text" as const, label: "Text", icon: FileText, color: CHART_COLORS.notify },
  { key: "image" as const, label: "Image", icon: ImageIcon, color: CHART_COLORS.digest },
  { key: "voice" as const, label: "Voice", icon: Mic, color: CHART_COLORS.mute },
];

interface MessageTypeChartProps {
  breakdown: MessageTypeBreakdown;
}

export function MessageTypeChart({ breakdown }: MessageTypeChartProps) {
  const data = TYPE_META.map((t) => ({ name: t.label, value: breakdown[t.key], color: t.color }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-text-muted">
        No messages yet
      </div>
    );
  }

  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.border} vertical={false} />
            <XAxis dataKey="name" stroke={CHART_COLORS.muted} fontSize={11} tickLine={false} axisLine={false} />
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
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex justify-around">
        {TYPE_META.map((t) => (
          <div key={t.key} className="flex items-center gap-1.5 text-xs text-text-muted">
            <t.icon className="h-3.5 w-3.5" />
            {t.label} ({breakdown[t.key]})
          </div>
        ))}
      </div>
    </div>
  );
}
