import "server-only";

import { countries as staticCountries } from "@/data/countries";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export type AdminRegionOption = {
  countrySlug: string;
  countryName: string;
  regionSlug: string;
  regionName: string;
};

export async function loadAdminRegionOptions(): Promise<AdminRegionOption[]> {
  const byKey = new Map<string, AdminRegionOption>();

  for (const country of staticCountries) {
    for (const region of country.regions ?? []) {
      byKey.set(`${country.slug}::${region.slug}`, {
        countrySlug: country.slug,
        countryName: country.name,
        regionSlug: region.slug,
        regionName: region.name,
      });
    }
  }

  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  if (!supabase) {
    return Array.from(byKey.values()).sort((a, b) =>
      `${a.countryName} ${a.regionName}`.localeCompare(`${b.countryName} ${b.regionName}`),
    );
  }

  const [{ data: countries }, { data: regions }] = await Promise.all([
    supabase.from("countries").select("slug, name").order("position", { ascending: true }),
    supabase
      .from("regions")
      .select("country_slug, slug, name, position")
      .order("position", { ascending: true }),
  ]);

  const countryNames = new Map<string, string>();
  for (const country of countries ?? []) {
    countryNames.set(country.slug, country.name);
  }
  for (const country of staticCountries) {
    if (!countryNames.has(country.slug)) {
      countryNames.set(country.slug, country.name);
    }
  }

  for (const region of regions ?? []) {
    byKey.set(`${region.country_slug}::${region.slug}`, {
      countrySlug: region.country_slug,
      countryName: countryNames.get(region.country_slug) ?? region.country_slug,
      regionSlug: region.slug,
      regionName: region.name,
    });
  }

  return Array.from(byKey.values()).sort((a, b) =>
    `${a.countryName} ${a.regionName}`.localeCompare(`${b.countryName} ${b.regionName}`),
  );
}
