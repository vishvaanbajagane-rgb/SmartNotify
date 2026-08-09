import { Bell, Inbox, ShieldOff } from "lucide-react";
import type { Action } from "@/lib/types";

const ACTION_META: Record<Action, { icon: typeof Bell; text: string; bg: string }> = {
  Notify: { icon: Bell, text: "text-notify", bg: "bg-notify-dim" },
  Digest: { icon: Inbox, text: "text-digest", bg: "bg-digest-dim" },
  Mute: { icon: ShieldOff, text: "text-mute", bg: "bg-mute-dim" },
};

export function ActionBadge({ action }: { action: Action }) {
  const meta = ACTION_META[action];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full ${meta.bg} px-2.5 py-1`}>
      <Icon className={`h-3.5 w-3.5 ${meta.text}`} strokeWidth={2.5} />
      <span className={`text-xs font-medium ${meta.text}`}>{action}</span>
    </span>
  );
}
