"use client";

import { useRef, useState } from "react";
import { Upload, X, ArrowLeft, ArrowRight } from "lucide-react";
import { mediaUrl } from "@/lib/media";

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  prefix?: string;
  label?: string;
}

export function MultiImageUploader({
  value,
  onChange,
  prefix = "uploads",
  label = "Images",
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setErr(null);
    setBusy(true);
    const next: string[] = [];
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("prefix", prefix);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const body = await res.json();
        if (!res.ok) {
          setErr(body?.message ?? body?.code ?? "Upload failed");
          continue;
        }
        next.push(body.key ?? body.publicUrl);
      }
      if (next.length) onChange([...value, ...next]);
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function move(idx: number, delta: number) {
    const target = idx + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  function addUrl() {
    if (!urlDraft.trim()) return;
    onChange([...value, urlDraft.trim()]);
    setUrlDraft("");
  }

  return (
    <div>
      <span className="block text-xs font-medium text-foreground/70 mb-1.5">
        {label}
      </span>
      {value.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {value.map((src, idx) => (
            <li
              key={`${src}-${idx}`}
              className="relative overflow-hidden rounded-xl border border-black/[0.08] bg-[#F5F5F7] aspect-[4/3]"
            >
              <img
                src={mediaUrl(src)}
                alt={`${label} ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-1.5 py-1 text-white">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  className="rounded-full p-1 hover:bg-white/20"
                  aria-label="Move left"
                >
                  <ArrowLeft className="h-3 w-3" />
                </button>
                <span className="text-[10px] font-medium">{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  className="rounded-full p-1 hover:bg-white/20"
                  aria-label="Move right"
                >
                  <ArrowRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="rounded-full p-1 hover:bg-white/20"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
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
          {busy ? "Uploading…" : value.length ? "Add more" : "Upload images"}
        </button>
        <div className="flex flex-1 min-w-[220px] items-center gap-2">
          <input
            type="text"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="Paste an image URL or R2 key"
            className="flex-1 rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs"
          />
          <button
            type="button"
            onClick={addUrl}
            className="rounded-full border border-black/15 px-3 py-1.5 text-[11px] font-semibold text-foreground/80 hover:bg-black/[0.04]"
          >
            Add URL
          </button>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-foreground/55">
        Entries can be public URLs or private R2 keys.
      </p>
      {err && <p className="mt-1 text-[11px] text-red-600">{err}</p>}
    </div>
  );
}
