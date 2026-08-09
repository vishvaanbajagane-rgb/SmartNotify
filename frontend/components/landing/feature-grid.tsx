import { Brain, Image as ImageIcon, Mic, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Explainable, not a black box",
    description:
      "Every decision ships with a confidence score and a plain-language reason — urgency, scam risk, business trust, all named explicitly.",
  },
  {
    icon: ImageIcon,
    title: "Reads images, not just text",
    description:
      "OCR extracts text from screenshots and forwarded images before routing them through the same decision engine as regular messages.",
  },
  {
    icon: Mic,
    title: "Transcribes voice notes",
    description:
      "Whisper converts voice messages to text automatically, so a spoken scam gets caught exactly like a typed one.",
  },
  {
    icon: ShieldCheck,
    title: "Learns who to trust",
    description:
      "Business trust scores are computed from real message history, not assumptions — verified senders vs. unverified accounts route differently.",
  },
];

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="rounded-card border border-border bg-surface p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-raised">
            <feature.icon className="h-4.5 w-4.5 text-notify" strokeWidth={2} />
          </div>
          <h3 className="mt-4 font-display text-sm font-bold text-text-primary">
            {feature.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
