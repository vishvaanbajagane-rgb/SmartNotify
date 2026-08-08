"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
}

export function Dropzone({ onUpload, uploading }: DropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) return;
    setFile(f);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5">
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
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <UploadCloud className="h-8 w-8 text-text-muted" />
        <div>
          <p className="text-sm text-text-primary">
            Drag & drop your messages.csv, or click to browse
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Columns auto-detected: sender, content, sender_type, message_type, forward_count,
            timestamp, is_verified_business
          </p>
        </div>
      </div>

      {file && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-ink px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-text-primary">
            <FileText className="h-4 w-4 text-notify" />
            {file.name}
            <span className="text-xs text-text-muted">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button
            onClick={() => setFile(null)}
            aria-label="Remove file"
            className="text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        disabled={!file || uploading}
        onClick={() => file && onUpload(file)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-notify px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
        {uploading ? "Uploading…" : "Upload dataset"}
      </button>
    </div>
  );
}