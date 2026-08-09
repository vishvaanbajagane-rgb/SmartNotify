import { ShieldAlert } from "lucide-react";
import type { FlaggedSender } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FlaggedSendersListProps {
  senders: FlaggedSender[];
}

export function FlaggedSendersList({ senders }: FlaggedSendersListProps) {
  if (senders.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">No flagged senders yet</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {senders.map((s) => {
        const pct = Math.round(s.scam_probability * 100);
        const isHigh = pct >= 50;
        return (
          <li key={s.sender} className="flex items-center gap-3">
            <ShieldAlert
              className={cn("h-4 w-4 shrink-0", isHigh ? "text-mute" : "text-digest")}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-text-primary">{s.sender}</span>
                <span className="font-mono text-xs text-text-muted">{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                <div
                  className={cn("h-full rounded-full", isHigh ? "bg-mute" : "bg-digest")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
