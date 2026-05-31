"use client";

import { useState, useTransition } from "react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { saveCountry } from "@/app/(admin)/admin/countries/actions";

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
        start(() => saveCountry(fd));
      }}
      className="rounded-2xl bg-white border border-black/[0.06] p-6 space-y-5"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Slug"
          name="slug"
          defaultValue={initial?.slug ?? ""}
          required
          readOnly={isEdit}
          pattern="[a-z0-9-]+"
        />
        <Field label="Name" name="name" defaultValue={initial?.name ?? ""} required />
      </div>
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-60"
      >
        {pending ? "Saving…" : isEdit ? "Save changes" : "Create country"}
      </button>
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
