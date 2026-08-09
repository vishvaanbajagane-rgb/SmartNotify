"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  onAnalyze: (file: File) => Promise<void>;
  analyzing: boolean;
}

export function ImageDropzone({ onAnalyze, analyzing }: ImageDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
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
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <ImagePlus className="h-8 w-8 text-text-muted" />
          <div>
            <p className="text-sm text-text-primary">
              Drop a screenshot or forwarded image, or click to browse
            </p>
            <p className="mt-1 text-xs text-text-muted">JPEG, PNG, or WebP</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Selected image preview"
            className="max-h-72 w-full rounded-lg border border-border object-contain"
          />
          <button
            onClick={clearFile}
            aria-label="Remove image"
            className="absolute right-2 top-2 rounded-full bg-ink/80 p-1.5 text-text-primary hover:bg-ink"
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
        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {analyzing ? "Reading image…" : "Analyze image"}
      </button>
    </div>
  );
}
