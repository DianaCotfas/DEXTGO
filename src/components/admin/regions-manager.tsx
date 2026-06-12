"use client";

import { useState, useTransition } from "react";
import { Trash2, PlusCircle } from "lucide-react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { saveRegion, deleteRegion } from "@/app/(admin)/admin/countries/actions";

type RegionRow = {
  country_slug: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  cover_url: string | null;
  position: number;
};

export function RegionsManager({
  countrySlug,
  initialRegions,
}: {
  countrySlug: string;
  initialRegions: RegionRow[];
}) {
  const [regions, setRegions] = useState(initialRegions);
  const [pending, start] = useTransition();

  function addStub() {
    setRegions((prev) => [
      ...prev,
      {
        country_slug: countrySlug,
        slug: "",
        name: "",
        tagline: "",
        description: "",
        cover_url: "",
        position: prev.length + 1,
      },
    ]);
  }

  return (
    <div className="space-y-3">
      {regions.map((r, idx) => (
        <RegionRow
          key={`${r.slug || "new"}-${idx}`}
          region={r}
          onDelete={() => setRegions((prev) => prev.filter((p) => p !== r))}
          pending={pending}
          start={start}
        />
      ))}
      <button
        type="button"
        onClick={addStub}
        className="inline-flex items-center gap-2 rounded-full bg-white border border-black/[0.08] text-foreground text-xs font-semibold px-4 py-2"
      >
        <PlusCircle className="w-3.5 h-3.5" /> Add region
      </button>
    </div>
  );
}

function RegionRow({
  region,
  onDelete,
  pending,
  start,
}: {
  region: RegionRow;
  onDelete: () => void;
  pending: boolean;
  start: React.TransitionStartFunction;
}) {
  const [coverUrl, setCoverUrl] = useState(region.cover_url ?? "");

  return (
    <form
      action={(fd) => {
        fd.set("cover_url", coverUrl);
        fd.set("country_slug", region.country_slug);
        if (region.slug) {
          fd.set("original_slug", region.slug);
        }
        start(() => saveRegion(fd));
      }}
      className="rounded-2xl bg-white border border-black/[0.06] p-4 space-y-3"
    >
      <div className="grid sm:grid-cols-3 gap-2">
        <input
          name="slug"
          defaultValue={region.slug}
          placeholder="region-slug"
          required
          pattern="[a-z0-9-]+"
          className="rounded-md border border-black/[0.08] px-3 py-1.5 text-sm"
        />
        <input
          name="name"
          defaultValue={region.name}
          placeholder="Region name"
          required
          className="rounded-md border border-black/[0.08] px-3 py-1.5 text-sm"
        />
        <input
          name="position"
          type="number"
          defaultValue={region.position}
          className="rounded-md border border-black/[0.08] px-3 py-1.5 text-sm"
        />
      </div>
      <input
        name="tagline"
        defaultValue={region.tagline ?? ""}
        placeholder="Tagline"
        className="w-full rounded-md border border-black/[0.08] px-3 py-1.5 text-sm"
      />
      <textarea
        name="description"
        defaultValue={region.description ?? ""}
        rows={2}
        placeholder="Description"
        className="w-full rounded-md border border-black/[0.08] px-3 py-2 text-sm"
      />
      <ImageUploader
        value={coverUrl}
        onChange={setCoverUrl}
        prefix={`countries/${region.country_slug}/regions`}
        label="Region cover"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#1D1D1F] text-white text-xs font-semibold px-4 py-1.5 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save region"}
        </button>
        {region.slug && (
          <button
            type="button"
            onClick={async () => {
              const fd = new FormData();
              fd.set("country_slug", region.country_slug);
              fd.set("slug", region.slug);
              start(async () => {
                await deleteRegion(fd);
                onDelete();
              });
            }}
            className="text-foreground/50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}
