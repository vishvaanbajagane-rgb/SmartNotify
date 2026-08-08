"use client";

import { motion } from "framer-motion";
import { Bell, Inbox, ShieldOff } from "lucide-react";
import type { Action } from "@/lib/types";

interface LaneMessage {
  sender: string;
  content: string;
  action: Action;
  reason: string;
  score: string;
}

const LANE_MESSAGES: LaneMessage[] = [
  {
    sender: "HDFC Bank",
    content: "Your OTP is 482910. Do not share this with anyone.",
    action: "Notify",
    reason: "Verified business · time-sensitive code",
    score: "trust 85%",
  },
  {
    sender: "Office Team",
    content: "Sprint planning moved to 3 PM today.",
    action: "Digest",
    reason: "Group message · not urgent",
    score: "urgency 9%",
  },
  {
    sender: "Unknown Number",
    content: "Congratulations! You won a lottery, click here to claim.",
    action: "Mute",
    reason: "Forwarded 45× · lottery scam pattern",
    score: "scam 83%",
  },
];

const LANE_META: Record
  Action,
  { icon: typeof Bell; label: string; text: string; bg: string; border: string }
> = {
  Notify: { icon: Bell, label: "Notify", text: "text-notify", bg: "bg-notify-dim", border: "border-notify/30" },
  Digest: { icon: Inbox, label: "Digest", text: "text-digest", bg: "bg-digest-dim", border: "border-digest/30" },
  Mute: { icon: ShieldOff, label: "Mute", text: "text-mute", bg: "bg-mute-dim", border: "border-mute/30" },
};

export function TriageLaneDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {LANE_MESSAGES.map((msg, i) => {
        const meta = LANE_META[msg.action];
        const Icon = meta.icon;
        return (
          <motion.div
            key={msg.sender}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 * i, ease: "easeOut" }}
            className={`flex flex-col gap-3 rounded-card border ${meta.border} bg-surface p-4`}
          >
            <div className={`flex w-fit items-center gap-1.5 rounded-full ${meta.bg} px-2.5 py-1`}>
              <Icon className={`h-3.5 w-3.5 ${meta.text}`} strokeWidth={2.5} />
              <span className={`text-xs font-medium ${meta.text}`}>{meta.label}</span>
            </div>

            <div>
              <p className="text-sm font-medium text-text-primary">{msg.sender}</p>
              <p className="mt-1 text-sm text-text-muted">{msg.content}</p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 * i + 0.35 }}
              className="mt-1 border-t border-border pt-3"
            >
              <p className="font-mono text-xs text-text-muted">{msg.reason}</p>
              <p className={`mt-1 font-mono text-xs ${meta.text}`}>{msg.score}</p>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}