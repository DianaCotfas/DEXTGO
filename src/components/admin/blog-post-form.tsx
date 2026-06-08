"use client";

import { useState, useTransition } from "react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { saveBlogPost } from "@/app/(admin)/admin/blog/actions";
import type { Json } from "@/lib/supabase/types";
import type { BlogBlock } from "@/types";

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
  const [blocks, setBlocks] = useState<EditableBlock[]>(
    parseInitialBlocks(initial?.body),
  );

  return (
    <form
      action={(fd) => {
        fd.set("cover_url", coverUrl);
        fd.set("body", JSON.stringify(serializeBlocks(blocks)));
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
      <BlogBlocksEditor blocks={blocks} setBlocks={setBlocks} />
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

type EditableBlock =
  | { id: string; type: "heading"; level: 2 | 3; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "quote"; text: string }
  | { id: string; type: "list"; itemsText: string }
  | { id: string; type: "image"; src: string; alt: string; caption: string };

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function blockTemplate(type: EditableBlock["type"]): EditableBlock {
  const id = makeId();
  if (type === "heading") return { id, type, level: 2, text: "" };
  if (type === "paragraph") return { id, type, text: "" };
  if (type === "quote") return { id, type, text: "" };
  if (type === "list") return { id, type, itemsText: "" };
  return { id, type, src: "", alt: "", caption: "" };
}

function parseInitialBlocks(value: Json | undefined): EditableBlock[] {
  if (Array.isArray(value)) {
    const parsed = value
      .map((raw) => toEditableBlock(raw))
      .filter((block): block is EditableBlock => !!block);
    if (parsed.length > 0) return parsed;
  }
  if (typeof value === "string" && value.trim()) {
    return [{ id: makeId(), type: "paragraph", text: value.trim() }];
  }
  return [{ id: makeId(), type: "paragraph", text: "Write your story here..." }];
}

function toEditableBlock(raw: unknown): EditableBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  const id = makeId();
  if (entry.type === "heading") {
    return {
      id,
      type: "heading",
      level: entry.level === 3 ? 3 : 2,
      text: typeof entry.text === "string" ? entry.text : "",
    };
  }
  if (entry.type === "paragraph") {
    return {
      id,
      type: "paragraph",
      text: typeof entry.text === "string" ? entry.text : "",
    };
  }
  if (entry.type === "quote") {
    return {
      id,
      type: "quote",
      text: typeof entry.text === "string" ? entry.text : "",
    };
  }
  if (entry.type === "list") {
    return {
      id,
      type: "list",
      itemsText: Array.isArray(entry.items)
        ? entry.items.filter((x) => typeof x === "string").join("\n")
        : "",
    };
  }
  if (entry.type === "image") {
    return {
      id,
      type: "image",
      src: typeof entry.src === "string" ? entry.src : "",
      alt: typeof entry.alt === "string" ? entry.alt : "",
      caption: typeof entry.caption === "string" ? entry.caption : "",
    };
  }
  return null;
}

function serializeBlocks(blocks: EditableBlock[]): BlogBlock[] {
  const serialized: BlogBlock[] = [];
  for (const block of blocks) {
    if (block.type === "heading") {
      const text = block.text.trim();
      if (!text) continue;
      serialized.push({ type: "heading", level: block.level, text });
      continue;
    }
    if (block.type === "paragraph") {
      const text = block.text.trim();
      if (!text) continue;
      serialized.push({ type: "paragraph", text });
      continue;
    }
    if (block.type === "quote") {
      const text = block.text.trim();
      if (!text) continue;
      serialized.push({ type: "quote", text });
      continue;
    }
    if (block.type === "list") {
      const items = block.itemsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      if (items.length === 0) continue;
      serialized.push({ type: "list", items });
      continue;
    }
    const src = block.src.trim();
    if (!src) continue;
    serialized.push({
      type: "image",
      src,
      alt: block.alt.trim() || undefined,
      caption: block.caption.trim() || undefined,
    });
  }
  return serialized.length > 0
    ? serialized
    : [{ type: "paragraph", text: "Write your story here..." }];
}

function BlogBlocksEditor({
  blocks,
  setBlocks,
}: {
  blocks: EditableBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<EditableBlock[]>>;
}) {
  function addBlock(type: EditableBlock["type"]) {
    setBlocks((prev) => [...prev, blockTemplate(type)]);
  }

  function updateBlock(id: string, patch: Partial<EditableBlock>) {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? ({ ...block, ...patch } as EditableBlock) : block)),
    );
  }

  function moveBlock(id: string, direction: "up" | "down") {
    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === id);
      if (index < 0) return prev;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function removeBlock(id: string) {
    setBlocks((prev) => {
      const filtered = prev.filter((block) => block.id !== id);
      return filtered.length > 0 ? filtered : [blockTemplate("paragraph")];
    });
  }

  return (
    <section className="space-y-3 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Article content</p>
        <p className="text-xs text-foreground/60">
          Add text and images as blocks. No JSON editing needed.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <AddBlockButton label="Heading" onClick={() => addBlock("heading")} />
        <AddBlockButton label="Paragraph" onClick={() => addBlock("paragraph")} />
        <AddBlockButton label="Quote" onClick={() => addBlock("quote")} />
        <AddBlockButton label="List" onClick={() => addBlock("list")} />
        <AddBlockButton label="Image" onClick={() => addBlock("image")} />
      </div>

      <div className="space-y-3">
        {blocks.map((block, index) => (
          <article key={block.id} className="rounded-xl border border-black/[0.08] bg-white p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/55">
                Block {index + 1} - {block.type}
              </p>
              <div className="flex items-center gap-1">
                <ActionButton
                  label="Up"
                  onClick={() => moveBlock(block.id, "up")}
                  disabled={index === 0}
                />
                <ActionButton
                  label="Down"
                  onClick={() => moveBlock(block.id, "down")}
                  disabled={index === blocks.length - 1}
                />
                <ActionButton label="Remove" onClick={() => removeBlock(block.id)} />
              </div>
            </div>

            {block.type === "heading" && (
              <div className="space-y-2">
                <label className="block">
                  <span className="text-[11px] font-medium text-foreground/70">Heading level</span>
                  <select
                    value={block.level}
                    onChange={(e) =>
                      updateBlock(block.id, { level: Number(e.target.value) as 2 | 3 })
                    }
                    className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
                  >
                    <option value={2}>H2</option>
                    <option value={3}>H3</option>
                  </select>
                </label>
                <textarea
                  value={block.text}
                  onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                  rows={3}
                  placeholder="Heading text"
                  className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
                />
              </div>
            )}

            {block.type === "paragraph" && (
              <textarea
                value={block.text}
                onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                rows={5}
                placeholder="Paragraph text"
                className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
              />
            )}

            {block.type === "quote" && (
              <textarea
                value={block.text}
                onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                rows={4}
                placeholder="Quote text"
                className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-sm italic focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
              />
            )}

            {block.type === "list" && (
              <div className="space-y-2">
                <p className="text-[11px] text-foreground/60">
                  One list item per line.
                </p>
                <textarea
                  value={block.itemsText}
                  onChange={(e) => updateBlock(block.id, { itemsText: e.target.value })}
                  rows={6}
                  placeholder={"First point\nSecond point\nThird point"}
                  className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
                />
              </div>
            )}

            {block.type === "image" && (
              <div className="space-y-2">
                <ImageUploader
                  value={block.src}
                  onChange={(src) => updateBlock(block.id, { src })}
                  prefix="blog/body"
                  label="Inline image"
                />
                <Field
                  label="Alt text"
                  value={block.alt}
                  onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                  placeholder="Describe the image for accessibility"
                />
                <Field
                  label="Caption"
                  value={block.caption}
                  onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                  placeholder="Optional caption under image"
                />
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function AddBlockButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-black/[0.1] bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-black/[0.03]"
    >
      + {label}
    </button>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-black/[0.1] px-2.5 py-1 text-[11px] font-medium text-foreground/80 disabled:opacity-40"
    >
      {label}
    </button>
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
