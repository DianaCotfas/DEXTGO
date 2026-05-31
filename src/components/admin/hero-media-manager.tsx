"use client";

import { useState, useTransition } from "react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { saveHeroMedia } from "@/app/(admin)/admin/hero-media/actions";

type Item = { page_slug: string; image_url: string; video_id: string };

export function HeroMediaManager({ items }: { items: Item[] }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <HeroRow key={it.page_slug} item={it} />
      ))}
    </ul>
  );
}

function HeroRow({ item }: { item: Item }) {
  const [imageUrl, setImageUrl] = useState(item.image_url);
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => {
        fd.set("page_slug", item.page_slug);
        fd.set("image_url", imageUrl);
        start(() => saveHeroMedia(fd));
      }}
      className="rounded-2xl bg-white border border-black/[0.06] p-5 space-y-3"
    >
      <h2 className="text-base font-semibold capitalize">
        {item.page_slug.replace(/-/g, " ")}
      </h2>
      <ImageUploader
        value={imageUrl}
        onChange={setImageUrl}
        prefix={`hero/${item.page_slug}`}
        label="Hero image"
      />
      <label className="block">
        <span className="text-xs font-medium text-foreground/70">
          Hero video reference (optional)
        </span>
        <input
          name="video_id"
          defaultValue={item.video_id}
          placeholder="Stream UID, .m3u8 URL, or MP4 URL"
          className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-3.5 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#1D1D1F] text-white text-xs font-semibold px-4 py-1.5 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
