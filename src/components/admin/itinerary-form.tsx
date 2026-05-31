"use client";

import { useState, useTransition } from "react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { MultiImageUploader } from "@/components/admin/multi-image-uploader";
import { VideoUploader } from "@/components/admin/video-uploader";
import { ExtrasEditor } from "@/components/admin/extras-editor";
import { saveItinerary } from "@/app/(admin)/admin/itineraries/actions";
import type { ItineraryExtras, TeaserFeature } from "@/types";
import { ITINERARY_INTERESTS } from "@/lib/itinerary-interest-filters";

type Initial = {
  id?: string;
  slug?: string;
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  sales_preview?: string | null;
  preview_image_urls?: string[] | null;
  extras?: ItineraryExtras | null;
  hero_image_url?: string | null;
  hero_video_id?: string | null;
  country_slug?: string | null;
  region_slug?: string | null;
  duration?: string | null;
  price_cents?: number;
  currency?: string;
  status?: "draft" | "published" | "archived";
  category?: string | null;
  category_color?: string | null;
};

export function ItineraryForm({ initial }: { initial?: Initial }) {
  const [heroUrl, setHeroUrl] = useState(initial?.hero_image_url ?? "");
  const [heroVideoRef, setHeroVideoRef] = useState(initial?.hero_video_id ?? "");
  const [previewImages, setPreviewImages] = useState<string[]>(
    initial?.preview_image_urls ?? [],
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [priceCents, setPriceCents] = useState(
    initial?.price_cents != null ? String(initial.price_cents) : "0",
  );
  const [extras, setExtras] = useState<ItineraryExtras>(initial?.extras ?? {});
  const [pending, start] = useTransition();
  const priceEuros = Math.max(0, Number(priceCents || "0")) / 100;
  const previewSubtitle = excerpt || "Add a short teaser subtitle for the public page.";
  const publicTeaser = extras.publicTeaser ?? {};
  const leftFeatures = publicTeaser.leftFeatures ?? [];
  const lockedFeatures = publicTeaser.lockedFeatures ?? [];

  function patchPublicTeaser(
    patch: Partial<NonNullable<ItineraryExtras["publicTeaser"]>>,
  ) {
    setExtras((prev) => ({
      ...prev,
      publicTeaser: {
        ...(prev.publicTeaser ?? {}),
        ...patch,
      },
    }));
  }

  return (
    <form
      action={(fd) => {
        fd.set("hero_image_url", heroUrl);
        fd.set("hero_video_id", heroVideoRef);
        fd.set("preview_image_urls", JSON.stringify(previewImages));
        fd.set("extras", JSON.stringify(normalizeExtrasForSave(extras)));
        start(() => saveItinerary(fd));
      }}
      className="rounded-2xl bg-white border border-black/[0.06] p-6 space-y-5"
    >
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <section className="rounded-2xl border border-black/[0.06] overflow-hidden">
        <div className="relative min-h-[260px] bg-[#0f0f11]">
          {heroUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroUrl} alt={title || "Hero preview"} className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/70" />
          <div className="relative z-10 p-5 sm:p-6 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
              Public hero preview
            </p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold leading-tight">
              {title || "Itinerary title"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-white/85">
              {previewSubtitle}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              {category && (
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                  {category}
                </span>
              )}
              {duration && (
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                  {duration}
                </span>
              )}
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-semibold">
                EUR {priceEuros.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/[0.06] p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-semibold">Section 1 - Hero and top bar</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />
          <Field
            label="Slug"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.currentTarget.value)}
            placeholder="rome-for-kids"
          />
        </div>
        <Field
          label="Short excerpt (hero subtitle)"
          name="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.currentTarget.value)}
        />
        <ImageUploader
          value={heroUrl}
          onChange={setHeroUrl}
          prefix="itineraries/heroes"
          label="Hero image"
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <VideoUploader
            value={heroVideoRef}
            onChange={setHeroVideoRef}
            prefix="itineraries/heroes/videos"
            label="Hero video"
            maxSizeMb={120}
          />
          <Field
            label="Duration"
            name="duration"
            value={duration}
            onChange={(e) => setDuration(e.currentTarget.value)}
            placeholder="5 days"
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field
            label="Country slug"
            name="country_slug"
            defaultValue={initial?.country_slug ?? ""}
            placeholder="italy"
          />
          <Field
            label="Region slug"
            name="region_slug"
            defaultValue={initial?.region_slug ?? ""}
            placeholder="lazio"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/70">
              Category <span className="text-foreground/40 font-normal">(interest filter)</span>
            </label>
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="">— None / not categorised —</option>
              {ITINERARY_INTERESTS.map((interest) => (
                <option key={interest.slug} value={interest.title}>
                  {interest.title} ({interest.label})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-foreground/45">
              This controls which &quot;Explore by Interest&quot; section the itinerary appears in.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field
            label="Price (cents)"
            name="price_cents"
            type="number"
            value={priceCents}
            onChange={(e) => setPriceCents(e.currentTarget.value)}
          />
          <Field
            label="Currency"
            name="currency"
            defaultValue={initial?.currency ?? "eur"}
          />
          <SelectField
            label="Status"
            name="status"
            defaultValue={initial?.status ?? "draft"}
            options={[
              { value: "draft", label: "Draft (private)" },
              { value: "published", label: "Published (public)" },
              { value: "archived", label: "Completed (private delivery ready)" },
            ]}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-black/[0.06] p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-semibold">Section 2 - Locked teaser (before purchase)</h3>
        <p className="text-xs text-foreground/65">
          This text and gallery appear in the locked teaser page before checkout.
        </p>
        <FieldArea
          label="Sales preview copy"
          name="sales_preview"
          defaultValue={initial?.sales_preview ?? ""}
          rows={7}
        />
        <MultiImageUploader
          value={previewImages}
          onChange={setPreviewImages}
          prefix="itineraries/previews"
          label="Preview gallery (shown before purchase)"
        />
        <div className="rounded-xl border border-black/[0.06] bg-[#fafafa] p-3 sm:p-4 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65">
            Teaser text controls (public page)
          </h4>
          <Field
            label="Teaser subtitle override (optional)"
            value={publicTeaser.subtitle ?? ""}
            onChange={(e) => patchPublicTeaser({ subtitle: e.currentTarget.value })}
            placeholder="Shown under the itinerary title in the locked teaser section."
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Locked box title"
              value={publicTeaser.lockedTitle ?? ""}
              onChange={(e) =>
                patchPublicTeaser({ lockedTitle: e.currentTarget.value })
              }
              placeholder="The interactive experience is locked."
            />
            <Field
              label="Locked box intro"
              value={publicTeaser.lockedIntro ?? ""}
              onChange={(e) =>
                patchPublicTeaser({ lockedIntro: e.currentTarget.value })
              }
              placeholder="After purchase, you'll unlock:"
            />
          </div>
          <TeaserFeatureListEditor
            title="Left highlights"
            subtitle="Cards under the sales copy in the locked teaser."
            items={leftFeatures}
            onChange={(next) => patchPublicTeaser({ leftFeatures: next })}
          />
          <TeaserFeatureListEditor
            title="Locked box bullet points"
            subtitle="Items shown inside the right lock card."
            items={lockedFeatures}
            onChange={(next) => patchPublicTeaser({ lockedFeatures: next })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-black/[0.06] p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-semibold">Section 3 - Unlocked intro (after purchase)</h3>
        <FieldArea
          label="Post-purchase intro"
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={5}
        />
      </section>

      <section className="rounded-2xl border border-black/[0.06] p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-semibold">Section 4 - Practical info</h3>
        <p className="text-xs text-foreground/65">
          Pharmacies, hospitals, and emergency numbers shown after day-by-day content.
        </p>
        <ExtrasEditor value={extras} onChange={setExtras} />
      </section>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-60"
      >
        {pending ? "Saving…" : initial?.id ? "Save changes" : "Create itinerary"}
      </button>
    </form>
  );
}

function normalizeExtrasForSave(extras: ItineraryExtras): ItineraryExtras {
  const publicTeaser = extras.publicTeaser
    ? {
        subtitle: (extras.publicTeaser.subtitle ?? "").trim(),
        lockedTitle: (extras.publicTeaser.lockedTitle ?? "").trim(),
        lockedIntro: (extras.publicTeaser.lockedIntro ?? "").trim(),
        leftFeatures: (extras.publicTeaser.leftFeatures ?? []).filter(
          (item) => item.title.trim() && item.body.trim(),
        ),
        lockedFeatures: (extras.publicTeaser.lockedFeatures ?? []).filter(
          (item) => item.title.trim() && item.body.trim(),
        ),
      }
    : undefined;

  return {
    ...extras,
    publicTeaser,
  };
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      <input
        {...rest}
        className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
      />
    </label>
  );
}

function FieldArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string },
) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      <textarea
        {...rest}
        className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TeaserFeatureListEditor({
  title,
  subtitle,
  items,
  onChange,
}: {
  title: string;
  subtitle: string;
  items: TeaserFeature[];
  onChange: (next: TeaserFeature[]) => void;
}) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white p-3 space-y-3">
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-foreground/55">{subtitle}</p>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="grid sm:grid-cols-[1fr_2fr_auto] gap-2">
            <input
              value={item.title}
              onChange={(e) =>
                onChange(
                  items.map((entry, i) =>
                    i === idx ? { ...entry, title: e.target.value } : entry,
                  ),
                )
              }
              placeholder="Title"
              className="rounded-xl border border-black/[0.08] px-3 py-1.5 text-xs"
            />
            <input
              value={item.body}
              onChange={(e) =>
                onChange(
                  items.map((entry, i) =>
                    i === idx ? { ...entry, body: e.target.value } : entry,
                  ),
                )
              }
              placeholder="Description"
              className="rounded-xl border border-black/[0.08] px-3 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              className="rounded-xl border border-black/[0.1] px-2 text-xs text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { title: "", body: "" }])}
        className="rounded-full border border-black/[0.1] px-3 py-1 text-xs font-semibold"
      >
        Add item
      </button>
    </div>
  );
}
