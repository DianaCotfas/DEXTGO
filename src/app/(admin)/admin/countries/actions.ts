"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

const CountrySchema = z.object({
  original_slug: z.string().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  cover_url: z.string().trim().optional().or(z.literal("")).nullable(),
  position: z.coerce.number().int().default(0),
});

function revalidateCountryPaths(slug: string, previousSlug?: string) {
  revalidatePath("/admin/countries");
  revalidatePath(`/admin/countries/${slug}`);
  revalidatePath("/itineraries");
  revalidatePath("/itineraries/countries/[country]", "page");
  revalidatePath(`/itineraries/countries/${slug}`);
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/admin/countries/${previousSlug}`);
    revalidatePath(`/itineraries/countries/${previousSlug}`);
  }
}

export async function saveCountry(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseAdminClient();
  if (!supabase) {
    throw new Error(
      "Admin write access is not configured. Set SUPABASE_SERVICE_ROLE_KEY on Vercel.",
    );
  }
  const raw = CountrySchema.parse(Object.fromEntries(formData));
  const originalSlug = slugify(raw.original_slug ?? raw.slug ?? raw.name);
  const slug = slugify(raw.slug || raw.name);
  if (!slug) throw new Error("Country slug is required.");

  const row = {
    slug,
    name: raw.name,
    tagline: raw.tagline,
    description: raw.description,
    cover_url: raw.cover_url,
    position: raw.position,
  };
  const isRename = originalSlug !== slug;

  if (isRename) {
    const { data: conflict } = await supabase
      .from("countries")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();
    if (conflict) throw new Error("A country with this slug already exists.");

    const { data: existing } = await supabase
      .from("countries")
      .select("*")
      .eq("slug", originalSlug)
      .maybeSingle();
    if (!existing) throw new Error("Country not found.");

    const { error: insertError } = await supabase.from("countries").insert(row);
    if (insertError) throw insertError;

    const { error: regionError } = await supabase
      .from("regions")
      .update({ country_slug: slug })
      .eq("country_slug", originalSlug);
    if (regionError) throw regionError;

    const { error: itineraryError } = await supabase
      .from("itineraries")
      .update({ country_slug: slug })
      .eq("country_slug", originalSlug);
    if (itineraryError) throw itineraryError;

    const { error: deleteError } = await supabase
      .from("countries")
      .delete()
      .eq("slug", originalSlug);
    if (deleteError) throw deleteError;
  } else {
    const { error } = await supabase.from("countries").upsert(row);
    if (error) throw error;
  }

  revalidateCountryPaths(slug, isRename ? originalSlug : undefined);
  redirect(`/admin/countries/${slug}?saved=1`);
}

export async function deleteCountry(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString()?.trim();
  if (!slug) return;

  const supabase = await createSupabaseAdminClient();
  if (!supabase) {
    throw new Error(
      "Admin write access is not configured. Set SUPABASE_SERVICE_ROLE_KEY on Vercel.",
    );
  }

  const { error } = await supabase.from("countries").delete().eq("slug", slug);
  if (error) throw error;

  revalidateCountryPaths(slug);
  redirect("/admin/countries?deleted=1");
}

const RegionSchema = z.object({
  original_slug: z.string().optional(),
  country_slug: z.string(),
  slug: z.string().min(1),
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
  const raw = RegionSchema.parse(Object.fromEntries(formData));
  const originalSlug = slugify(raw.original_slug ?? raw.slug ?? raw.name);
  const slug = slugify(raw.slug || raw.name);
  if (!slug) throw new Error("Region slug is required.");

  const row = {
    country_slug: raw.country_slug,
    slug,
    name: raw.name,
    tagline: raw.tagline,
    description: raw.description,
    cover_url: raw.cover_url,
    position: raw.position,
  };
  const isRename = originalSlug !== slug;

  if (isRename) {
    const { data: existing } = await supabase
      .from("regions")
      .select("country_slug, slug")
      .eq("country_slug", row.country_slug)
      .eq("slug", originalSlug)
      .maybeSingle();
    if (!existing) throw new Error("Region not found.");

    const { error: deleteError } = await supabase
      .from("regions")
      .delete()
      .eq("country_slug", row.country_slug)
      .eq("slug", originalSlug);
    if (deleteError) throw deleteError;
  }

  const { error } = await supabase.from("regions").upsert(row);
  if (error) throw error;
  revalidatePath(`/admin/countries/${row.country_slug}`);
  revalidatePath(`/itineraries/countries/${row.country_slug}`);
  revalidatePath(
    `/itineraries/countries/${row.country_slug}/${row.slug}`,
  );
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
  revalidatePath(`/itineraries/countries/${country}`);
}
