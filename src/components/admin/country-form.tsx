"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { deleteCountry, saveCountry } from "@/app/(admin)/admin/countries/actions";

type Initial = {
  slug?: string;
  name?: string;
  tagline?: string | null;
  description?: string | null;
  cover_url?: string | null;
  position?: number;
};

export function CountryForm({ initial }: { initial?: Initial }) {
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "");
  const [pending, start] = useTransition();
  const isEdit = !!initial?.slug;

  return (
    <form
      action={(fd) => {
        fd.set("cover_url", coverUrl);
        if (isEdit && initial?.slug) {
          fd.set("original_slug", initial.slug);
        }
        start(() => saveCountry(fd));
      }}
      className="rounded-2xl bg-white border border-black/[0.06] p-6 space-y-5"
    >
      {isEdit && initial?.slug && (
        <input type="hidden" name="original_slug" value={initial.slug} />
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Slug"
          name="slug"
          defaultValue={initial?.slug ?? ""}
          required
          placeholder="italy"
        />
        <Field label="Name" name="name" defaultValue={initial?.name ?? ""} required />
      </div>
      <p className="text-[11px] text-foreground/55 -mt-2">
        Slugs are auto-formatted (lowercase, hyphens). You can edit the slug after creation.
      </p>
      <Field label="Tagline" name="tagline" defaultValue={initial?.tagline ?? ""} />
      <FieldArea
        label="Description"
        name="description"
        rows={4}
        defaultValue={initial?.description ?? ""}
      />
      <ImageUploader
        value={coverUrl}
        onChange={setCoverUrl}
        prefix="countries/covers"
        label="Cover image"
      />
      <Field
        label="Position"
        name="position"
        type="number"
        defaultValue={(initial?.position ?? 0).toString()}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-60"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create country"}
        </button>
        {isEdit && initial?.slug && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (
                !window.confirm(
                  `Delete "${initial.name ?? initial.slug}"? Regions linked to this country will also be removed.`,
                )
              ) {
                return;
              }
              const fd = new FormData();
              fd.set("slug", initial.slug!);
              start(() => deleteCountry(fd));
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 text-red-600 text-sm font-semibold px-5 py-2.5 disabled:opacity-60 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete country
          </button>
        )}
      </div>
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      <input
        {...rest}
        className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15 disabled:opacity-60"
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
