"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

const PostSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  cover_url: z.string().trim().optional().or(z.literal("")).nullable(),
  category: z.string().optional().nullable(),
  read_minutes: z.coerce.number().int().min(0).optional().nullable(),
  body: z.string().optional().nullable(),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]),
});

export async function saveBlogPost(formData: FormData) {
  await requireAdmin();
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  if (!supabase) throw new Error("Supabase not configured");
  const raw = Object.fromEntries(formData);
  const parsed = PostSchema.parse(raw);

  let body: Json = [];
  if (parsed.body) {
    try {
      body = JSON.parse(parsed.body) as Json;
    } catch {
      body = [{ type: "paragraph", text: parsed.body }];
    }
  }

  const payload = {
    slug: parsed.slug,
    title: parsed.title,
    excerpt: parsed.excerpt,
    cover_url: parsed.cover_url,
    category: parsed.category,
    read_minutes: parsed.read_minutes,
    seo_title: parsed.seo_title,
    seo_description: parsed.seo_description,
    status: parsed.status,
    body,
    published_at: parsed.status === "published" ? new Date().toISOString() : null,
  };

  await supabase.from("blog_posts").upsert(payload);
  revalidatePath("/admin/blog");
  revalidatePath(`/blog/${parsed.slug}`);
  redirect(`/admin/blog/${parsed.slug}`);
}
