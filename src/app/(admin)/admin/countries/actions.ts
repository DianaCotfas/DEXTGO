"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const CountrySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  cover_url: z.string().trim().optional().or(z.literal("")).nullable(),
  position: z.coerce.number().int().default(0),
});

export async function saveCountry(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseAdminClient();
  if (!supabase) {
    throw new Error(
      "Admin write access is not configured. Set SUPABASE_SERVICE_ROLE_KEY on Vercel.",
    );
  }
  const parsed = CountrySchema.parse(Object.fromEntries(formData));
  const { error } = await supabase.from("countries").upsert(parsed);
  if (error) throw error;
  revalidatePath("/admin/countries");
  revalidatePath(`/admin/countries/${parsed.slug}`);
  redirect(`/admin/countries/${parsed.slug}`);
}

const RegionSchema = z.object({
  country_slug: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  cover_url: z.string().trim().optional().or(z.literal("")).nullable(),
  position: z.coerce.number().int().default(0),
});

export async function saveRegion(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseAdminClient();
  if (!supabase) {
    throw new Error(
      "Admin write access is not configured. Set SUPABASE_SERVICE_ROLE_KEY on Vercel.",
    );
  }
  const parsed = RegionSchema.parse(Object.fromEntries(formData));
  const { error } = await supabase.from("regions").upsert(parsed);
  if (error) throw error;
  revalidatePath(`/admin/countries/${parsed.country_slug}`);
}

export async function deleteRegion(formData: FormData) {
  await requireAdmin();
  const country = formData.get("country_slug")?.toString();
  const slug = formData.get("slug")?.toString();
  if (!country || !slug) return;
  const supabase = await createSupabaseAdminClient();
  if (!supabase) {
    throw new Error(
      "Admin write access is not configured. Set SUPABASE_SERVICE_ROLE_KEY on Vercel.",
    );
  }
  const { error } = await supabase
    .from("regions")
    .delete()
    .eq("country_slug", country)
    .eq("slug", slug);
  if (error) throw error;
  revalidatePath(`/admin/countries/${country}`);
}
