import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accentClassName?: string;
  sublabel?: string;
}

export function StatCard({ label, value, icon: Icon, accentClassName, sublabel }: StatCardProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-text-muted">{label}</p>
        {Icon && <Icon className={cn("h-4 w-4", accentClassName ?? "text-text-muted")} />}
      </div>
      <p className="mt-2 font-display text-3xl font-bold font-tabular text-text-primary">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-text-muted">{sublabel}</p>}
    </div>
  );
}
