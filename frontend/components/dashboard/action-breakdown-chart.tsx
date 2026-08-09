"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ActionBreakdown } from "@/lib/types";
import { ACTION_COLORS } from "@/lib/chart-colors";

interface ActionBreakdownChartProps {
  breakdown: ActionBreakdown;
}

export function ActionBreakdownChart({ breakdown }: ActionBreakdownChartProps) {
  const data = (["Notify", "Digest", "Mute"] as const).map((action) => ({
    name: action,
    value: breakdown[action],
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-text-muted">
        No predictions yet
      </div>
    );
  }

  return (
    <div className="relative h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={64}
            outerRadius={92}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={ACTION_COLORS[entry.name]} />
            ))}
          </Pie>
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
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-text-primary">{total}</span>
        <span className="text-xs text-text-muted">messages</span>
      </div>

      <div className="mt-2 flex justify-center gap-4">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-text-muted">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: ACTION_COLORS[entry.name] }}
            />
            {entry.name} ({entry.value})
          </div>
        ))}
      </div>
    </div>
  );
}
