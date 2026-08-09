"use client";

import { motion } from "framer-motion";
import { Bell, EyeOff, Inbox, MessageCircle } from "lucide-react";

const NOW_LABEL = "now";

export function WhatsAppNotificationDemo() {
  return (
    <div className="mx-auto max-w-sm">
      {/* Phone frame */}
      <div className="rounded-[2rem] border-4 border-surface-raised bg-ink p-3 shadow-2xl">
        <div className="rounded-[1.5rem] bg-gradient-to-b from-surface-raised/60 to-ink px-3 py-6">
          {/* Lock screen clock */}
          <div className="mb-6 text-center">
            <p className="font-display text-4xl font-bold text-text-primary">9:41</p>
            <p className="mt-1 text-xs text-text-muted">Tuesday, August 4</p>
          </div>

          {/* Notify: full banner, arrives immediately */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-2 flex items-start gap-2.5 rounded-xl border border-notify/20 bg-surface/95 p-3 shadow-lg backdrop-blur"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-notify-dim">
              <MessageCircle className="h-4 w-4 text-notify" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text-primary">HDFC Bank</p>
                <p className="text-[10px] text-text-muted">{NOW_LABEL}</p>
              </div>
              <p className="truncate text-xs text-text-muted">
                Your OTP is 482910. Do not share this with anyone.
              </p>
            </div>
          </motion.div>

          {/* Digest: bundled, arrives with delay, visually quieter */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="mb-2 flex items-center gap-2.5 rounded-xl border border-border bg-surface/70 p-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-digest-dim">
              <Inbox className="h-4 w-4 text-digest" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-primary">3 messages digested</p>
              <p className="truncate text-[11px] text-text-muted">
                Office Team, Family Group, and 1 more — none urgent
              </p>
            </div>
          </motion.div>

          {/* Mute: no banner at all, just a quiet footnote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-text-muted"
          >
            <EyeOff className="h-3 w-3" />
            1 message muted silently — 83% scam risk
          </motion.div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-muted">
        <Bell className="h-3.5 w-3.5" />
        This is what actually reaches your lock screen
      </div>
    </div>
  );
}
