import { ITINERARY_INTERESTS } from "@/lib/itinerary-interest-filters";

export function normalizeSlugValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function normalizeStringList(values: string[] | null | undefined): string[] {
  if (!values?.length) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }
  return normalized;
}

export function resolveItineraryCategories(
  categories: string[] | null | undefined,
  legacyCategory?: string | null,
): string[] {
  const merged = normalizeStringList([
    ...(categories ?? []),
    ...(legacyCategory ? [legacyCategory] : []),
  ]);
  return merged;
}

export function resolveItineraryRegionSlugs(
  regionSlugs: string[] | null | undefined,
  legacyRegionSlug?: string | null,
): string[] {
  return normalizeStringList([
    ...(regionSlugs ?? []),
    ...(legacyRegionSlug ? [legacyRegionSlug] : []),
  ]).map((slug) => normalizeSlugValue(slug));
}

export function syncLegacyTaxonomyFields(input: {
  regionSlugs: string[];
  categories: string[];
}) {
  return {
    region_slug: input.regionSlugs[0] ?? null,
    category: input.categories[0] ?? null,
  };
}

export function itineraryMatchesInterest(
  categories: string[] | null | undefined,
  legacyCategory: string | null | undefined,
  interestSlug: string,
): boolean {
  const rule = ITINERARY_INTERESTS.find((item) => item.slug === interestSlug);
  if (!rule) return false;

  const values = resolveItineraryCategories(categories, legacyCategory).map((value) =>
    value.toLowerCase(),
  );
  if (!values.length) return false;

  const candidates = new Set(
    [rule.title, rule.label, rule.slug, ...rule.keywords].map((value) =>
      value.toLowerCase(),
    ),
  );

  return values.some((value) => candidates.has(value));
}

export function itineraryMatchesRegion(
  row: {
    country_slug?: string | null;
    region_slug?: string | null;
    region_slugs?: string[] | null;
  },
  countrySlug: string,
  regionSlug: string,
): boolean {
  const normalizedCountry = normalizeSlugValue(countrySlug);
  const normalizedRegion = normalizeSlugValue(regionSlug);
  if (normalizeSlugValue(row.country_slug) !== normalizedCountry) return false;

  const regionSlugs = resolveItineraryRegionSlugs(row.region_slugs, row.region_slug);
  return regionSlugs.includes(normalizedRegion);
}

export function primaryCategoryLabel(
  categories: string[] | null | undefined,
  legacyCategory?: string | null,
): string | undefined {
  return resolveItineraryCategories(categories, legacyCategory)[0];
}
