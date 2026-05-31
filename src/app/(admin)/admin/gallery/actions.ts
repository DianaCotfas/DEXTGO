"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

const ItemSchema = z.object({
  id: z.string().uuid().optional(),
  image_url: z.string().trim().min(1),
  caption: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  position: z.coerce.number().int().default(0),
});

export async function saveGalleryItem(formData: FormData) {
  await requireAdmin();
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  if (!supabase) throw new Error("Supabase not configured");
  const parsed = ItemSchema.parse(Object.fromEntries(formData));
  let saved: {
    id: string;
    image_url: string;
    caption: string | null;
    location: string | null;
    position: number;
  } | null = null;
  if (parsed.id) {
    const { data } = await supabase
      .from("gallery_items")
      .update(parsed)
      .eq("id", parsed.id)
      .select("id, image_url, caption, location, position")
      .maybeSingle();
    saved = data;
  } else {
    const { data } = await supabase
      .from("gallery_items")
      .insert(parsed)
      .select("id, image_url, caption, location, position")
      .maybeSingle();
    saved = data;
  }
  revalidatePath("/admin/gallery");
  revalidatePath("/");
  return { item: saved };
}

export async function deleteGalleryItem(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  if (!supabase) throw new Error("Supabase not configured");
  await supabase.from("gallery_items").delete().eq("id", id);
  revalidatePath("/admin/gallery");
  revalidatePath("/");
}
