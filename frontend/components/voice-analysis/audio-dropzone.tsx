"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioDropzoneProps {
  onAnalyze: (file: File) => Promise<void>;
  analyzing: boolean;
}

export function AudioDropzone({ onAnalyze, analyzing }: AudioDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("audio/")) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }, []);

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      {!previewUrl ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-14 text-center transition-colors",
            dragActive ? "border-notify bg-notify-dim/30" : "border-border hover:border-text-muted"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="audio/ogg,audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/m4a,audio/mp4"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <Mic className="h-8 w-8 text-text-muted" />
          <div>
            <p className="text-sm text-text-primary">
              Drop a voice note, or click to browse
            </p>
            <p className="mt-1 text-xs text-text-muted">OGG, MP3, WAV, WebM, or M4A</p>
          </div>
        </div>
      ) : (
        <div className="relative flex items-center gap-3 rounded-lg border border-border bg-ink px-4 py-3">
          <audio controls src={previewUrl} className="h-9 flex-1" />
          <button
            onClick={clearFile}
            aria-label="Remove audio"
            className="shrink-0 text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        disabled={!file || analyzing}
        onClick={() => file && onAnalyze(file)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-notify px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
        {analyzing ? "Transcribing…" : "Analyze voice note"}
      </button>
    </div>
  );
}
