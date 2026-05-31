"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const Schema = z.object({
  page_slug: z.string().min(1),
  image_url: z.string().trim().optional().or(z.literal("")).nullable(),
  video_id: z.string().trim().optional().nullable(),
});

export async function saveHeroMedia(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase not configured");
  const parsed = Schema.parse(Object.fromEntries(formData));
  await supabase.from("hero_media").upsert(parsed);
  revalidatePath("/admin/hero-media");
  const pathBySlug: Record<string, string> = {
    home: "/",
    itineraries: "/itineraries",
    about: "/about",
    contact: "/contact",
    faq: "/faq",
    blog: "/blog",
    "personalized-itineraries": "/personalized-itineraries",
  };
  revalidatePath(pathBySlug[parsed.page_slug] ?? "/");
}
