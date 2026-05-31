"use client";

import { Heart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "dextgo.savedTrips";
const UPDATE_EVENT = "saved-trips-updated";

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeLocal(slugs: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: slugs }));
}

async function syncFromServer(): Promise<string[] | null> {
  try {
    const res = await fetch("/api/saved-trips", { credentials: "include" });
    if (!res.ok) return null;
    const body = (await res.json()) as { slugs?: string[] };
    if (!Array.isArray(body.slugs)) return null;
    return body.slugs;
  } catch {
    return null;
  }
}

async function persistToServer(slug: string, action: "save" | "remove") {
  try {
    const res = await fetch("/api/saved-trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ itinerarySlug: slug, action }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function SaveTripButton({
  itinerarySlug,
  className,
}: {
  itinerarySlug: string;
  className?: string;
}) {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setSavedSlugs(readLocal());
      setHydrated(true);
    });
    void (async () => {
      const remote = await syncFromServer();
      if (remote) {
        writeLocal(remote);
        setSavedSlugs(remote);
      }
    })();

    const sync = () => setSavedSlugs(readLocal());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync as EventListener);
    };
  }, []);

  const saved = useMemo(
    () => savedSlugs.includes(itinerarySlug),
    [savedSlugs, itinerarySlug],
  );
  const isSaved = hydrated ? saved : false;

  function toggle(event: { preventDefault: () => void; stopPropagation: () => void }) {
    event.preventDefault();
    event.stopPropagation();
    const action = saved ? "remove" : "save";
    const next = saved
      ? savedSlugs.filter((slug) => slug !== itinerarySlug)
      : [...savedSlugs, itinerarySlug];
    setSavedSlugs(next);
    writeLocal(next);
    void persistToServer(itinerarySlug, action);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") toggle(event);
      }}
      className={
        className ??
        "inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-md hover:bg-black/40"
      }
      aria-label={isSaved ? "Remove from saved trips" : "Save trip"}
      aria-pressed={isSaved}
      title={isSaved ? "Saved" : "Save trip"}
    >
      <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
    </button>
  );
}

export function getSavedTripSlugsClient() {
  return readLocal();
}
