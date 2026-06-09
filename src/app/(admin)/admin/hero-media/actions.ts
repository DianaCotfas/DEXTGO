"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Schema = z.object({
  page_slug: z.string().min(1),
  image_url: z.string().trim().optional().or(z.literal("")).nullable(),
  video_id: z.string().trim().optional().nullable(),
});

export async function saveHeroMedia(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseAdminClient();
  if (!supabase) {
    throw new Error(
      "Admin write access is not configured. Set SUPABASE_SERVICE_ROLE_KEY on Vercel.",
    );
  }
  const parsed = Schema.parse(Object.fromEntries(formData));
  const { error } = await supabase.from("hero_media").upsert(parsed);
  if (error) throw error;
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
