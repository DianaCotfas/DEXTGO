"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { mediaUrl } from "@/lib/media";

interface VideoUploaderProps {
  value: string;
  onChange: (ref: string) => void;
  prefix?: string;
  label?: string;
  maxSizeMb?: number;
}

export function VideoUploader({
  value,
  onChange,
  prefix = "uploads/videos",
  label = "Video",
  maxSizeMb = 120,
}: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErr(`Video is too large. Max ${maxSizeMb}MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", prefix);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) {
        setErr(body?.message ?? body?.code ?? "Upload failed");
      } else {
        onChange(body.key ?? body.publicUrl);
      }
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="block text-xs font-medium text-foreground/70 mb-1.5">{label}</span>
      <div className="flex items-center gap-3">
        <div className="relative h-20 w-32 rounded-xl bg-[#F5F5F7] overflow-hidden border border-black/[0.06] flex items-center justify-center">
          {value ? (
            <video
              src={mediaUrl(value)}
              className="h-full w-full object-cover"
              muted
              playsInline
              loop
              autoPlay
            />
          ) : (
            <span className="text-[10px] text-foreground/40">No video</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={onSelect}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] text-white text-xs font-semibold px-4 py-1.5 disabled:opacity-60"
          >
            <Upload className="w-3.5 h-3.5" />
            {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 text-[11px] text-foreground/60 hover:text-foreground"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          )}
        </div>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste a video URL or R2 key"
        className="mt-2 w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs"
      />
      <p className="mt-1 text-[11px] text-foreground/55">
        Max upload size: {maxSizeMb}MB. Stored value can be a private R2 key.
      </p>
      {err && <p className="mt-1 text-[11px] text-red-600">{err}</p>}
    </div>
  );
}
