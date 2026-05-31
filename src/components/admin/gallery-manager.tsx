"use client";

import { useState, useTransition } from "react";
import { Trash2, PlusCircle } from "lucide-react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { mediaUrl } from "@/lib/media";
import {
  saveGalleryItem,
  deleteGalleryItem,
} from "@/app/(admin)/admin/gallery/actions";

type Item = {
  id: string;
  image_url: string;
  caption: string | null;
  location: string | null;
  position: number;
};

export function GalleryManager({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [pending, start] = useTransition();
  const [draftUrl, setDraftUrl] = useState("");

  return (
    <div className="space-y-4">
      <form
        action={(fd) => {
          if (!draftUrl) return;
          fd.set("image_url", draftUrl);
          fd.set("position", String(items.length + 1));
          start(async () => {
            const result = await saveGalleryItem(fd);
            const savedItem = result?.item;
            if (savedItem) {
              setItems((prev) =>
                [...prev, savedItem].sort((a, b) => a.position - b.position),
              );
            }
            setDraftUrl("");
          });
        }}
        className="rounded-2xl bg-white border border-black/[0.06] p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold">Add a photo</h2>
        <ImageUploader
          value={draftUrl}
          onChange={setDraftUrl}
          prefix="gallery"
          label="Image"
        />
        <div className="grid sm:grid-cols-2 gap-2">
          <input
            name="caption"
            placeholder="Caption"
            className="rounded-md border border-black/[0.08] px-3 py-1.5 text-sm"
          />
          <input
            name="location"
            placeholder="Location"
            className="rounded-md border border-black/[0.08] px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending || !draftUrl}
          className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] text-white text-xs font-semibold px-4 py-1.5 disabled:opacity-60"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Add to gallery
        </button>
      </form>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((it) => (
          <li
            key={it.id}
            className="rounded-2xl bg-white border border-black/[0.06] overflow-hidden"
          >
            <div className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(it.image_url)}
                alt={it.caption ?? "Gallery"}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-3 space-y-1">
              {it.caption && <p className="text-xs font-semibold">{it.caption}</p>}
              {it.location && (
                <p className="text-[11px] text-foreground/50">{it.location}</p>
              )}
              <form
                action={(fd) => {
                  fd.set("id", it.id);
                  start(async () => {
                    await deleteGalleryItem(fd);
                    setItems((prev) => prev.filter((p) => p.id !== it.id));
                  });
                }}
              >
                <button
                  type="submit"
                  className="text-[11px] text-red-600 inline-flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
