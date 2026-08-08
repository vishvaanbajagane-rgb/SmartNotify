import Link from "next/link";
import { ArrowRight, Radio, Upload } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { TriageLaneDemo } from "@/components/landing/triage-lane-demo";
import { FeatureGrid } from "@/components/landing/feature-grid";

export default function Home() {
  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <div className="flex items-center gap-2 font-mono text-xs text-notify">
          <Radio className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>explainable ai · notify / digest / mute</span>
        </div>

        <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight text-text-primary sm:text-5xl">
          Every WhatsApp message, sorted before it reaches you.
        </h1>

        <p className="mt-5 max-w-xl text-lg text-text-muted">
          SmartNotify AI reads content, sender trust, history, and media — then
          routes each message to Notify, Digest, or Mute, with a plain-language
          reason attached to every decision.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full bg-notify px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface"
          >
            <Upload className="h-4 w-4" />
            Upload a dataset
          </Link>
        </div>
      </section>

      {/* Signature element: live triage lanes */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-text-muted">Same message, three real outcomes</p>
          <p className="font-mono text-xs text-text-muted">live decision engine output</p>
        </div>
        <TriageLaneDemo />
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Built to explain itself
        </h2>
        <p className="mt-2 max-w-xl text-text-muted">
          Every signal that feeds the decision — urgency, scam risk, business
          trust, spam probability — is visible, not hidden behind a single score.
        </p>
        <div className="mt-8">
          <FeatureGrid />
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-12 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg font-bold text-text-primary">
              Ready to see it triage your messages?
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Upload a CSV or predict a single message from the dashboard.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full bg-notify px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

