"use client";

import { useState, useTransition } from "react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { saveBlogPost } from "@/app/(admin)/admin/blog/actions";
import type { Json } from "@/lib/supabase/types";

type Initial = {
  slug?: string;
  title?: string;
  excerpt?: string | null;
  cover_url?: string | null;
  category?: string | null;
  read_minutes?: number | null;
  body?: Json;
  seo_title?: string | null;
  seo_description?: string | null;
  status?: "draft" | "published" | "archived";
};

export function BlogPostForm({ initial }: { initial?: Initial }) {
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "");
  const [pending, start] = useTransition();
  const isEdit = !!initial?.slug;
  const bodyDefault = initial?.body
    ? JSON.stringify(initial.body, null, 2)
    : '[{"type":"paragraph","text":"Write your story here..."}]';
  const [bodyText, setBodyText] = useState(bodyDefault);
  const [inlineImageUrl, setInlineImageUrl] = useState("");

  function insertImageBlock() {
    const src = inlineImageUrl.trim();
    if (!src) return;
    let blocks: Json = [];
    try {
      const parsed = JSON.parse(bodyText);
      blocks = Array.isArray(parsed) ? (parsed as Json) : [];
    } catch {
      blocks = [{ type: "paragraph", text: bodyText.trim() } as Json];
    }
    const next = [
      ...(Array.isArray(blocks) ? blocks : []),
      { type: "image", src, alt: "", caption: "" } as Json,
    ];
    setBodyText(JSON.stringify(next, null, 2));
    setInlineImageUrl("");
  }

  return (
    <form
      action={(fd) => {
        fd.set("cover_url", coverUrl);
        fd.set("body", bodyText);
        start(() => saveBlogPost(fd));
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
        <Field label="Title" name="title" defaultValue={initial?.title ?? ""} required />
      </div>
      <Field label="Excerpt" name="excerpt" defaultValue={initial?.excerpt ?? ""} />
      <ImageUploader
        value={coverUrl}
        onChange={setCoverUrl}
        prefix="blog/covers"
        label="Cover image"
      />
      <div className="grid sm:grid-cols-3 gap-4">
        <Field
          label="Category"
          name="category"
          defaultValue={initial?.category ?? ""}
          placeholder="Travel"
        />
        <Field
          label="Read minutes"
          name="read_minutes"
          type="number"
          defaultValue={(initial?.read_minutes ?? 5).toString()}
        />
        <SelectField
          label="Status"
          name="status"
          defaultValue={initial?.status ?? "draft"}
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived" },
          ]}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="SEO title"
          name="seo_title"
          defaultValue={initial?.seo_title ?? ""}
        />
        <Field
          label="SEO description"
          name="seo_description"
          defaultValue={initial?.seo_description ?? ""}
        />
      </div>
      <FieldArea
        label="Body (JSON array of blocks: heading | paragraph | quote | list | image)"
        name="body"
        rows={14}
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
      />
      <div className="rounded-xl border border-black/[0.06] bg-[#fafafa] p-3 space-y-2">
        <p className="text-xs font-semibold text-foreground/70">
          Insert image block into article body
        </p>
        <ImageUploader
          value={inlineImageUrl}
          onChange={setInlineImageUrl}
          prefix="blog/body"
          label="Inline image"
        />
        <button
          type="button"
          onClick={insertImageBlock}
          disabled={!inlineImageUrl}
          className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-xs font-semibold text-foreground disabled:opacity-50"
        >
          Add image block to body JSON
        </button>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-60"
      >
        {pending ? "Saving…" : isEdit ? "Save changes" : "Create post"}
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
        className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
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
