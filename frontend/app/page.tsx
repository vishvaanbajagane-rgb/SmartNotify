import { Navbar } from "@/components/shared/navbar";

export default function Home() {
  return (
    <main>
      <Navbar />
      <div className="mx-auto flex max-w-6xl flex-col items-start px-6 py-24">
        <p className="font-mono text-sm text-notify">scaffold online</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-text-primary">
          Landing page hero arrives next.
        </h1>
        <p className="mt-3 max-w-xl text-text-muted">
          This placeholder confirms the Phase 13 scaffold — Tailwind tokens, fonts,
          navbar, and the API client — builds and runs end to end.
        </p>
      </div>
    </main>
  );
}