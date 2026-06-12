import "server-only";

import type { BlogPost, Country, Region } from "@/types";
import { blogPosts as staticBlogPosts } from "@/data/blog-posts";
import { countries as staticCountries } from "@/data/countries";
import { featuredItineraries } from "@/data/itineraries";
import { HERO_MEDIA, type HeroMedia } from "@/lib/hero-media";
import { resolveR2Url } from "@/lib/r2";
import { streamSourcesFromReference } from "@/lib/stream";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export type MarketingItineraryCard = {
  id: string;
  slug: string;
  title: string;
  country: string;
  duration: string;
  price: number;
  image: string;
  excerpt: string;
  category?: string;
};

export type MarketingCountryCard = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
};

export type MarketingGalleryCard = {
  id: string;
  src: string;
  alt: string;
  location: string;
};

export const DEFAULT_ITINERARY_CARD_IMAGE = "/images/imaginegallery/napoli.png";
const DEFAULT_ITINERARY_TITLE = "Untitled itinerary";
const DEFAULT_ITINERARY_EXCERPT = "A curated travel experience by DEXTGO.";
const DEFAULT_ITINERARY_COUNTRY = "Destination";
const DEFAULT_ITINERARY_DURATION = "Custom duration";

const fallbackHeroByPageSlug: Record<string, HeroMedia> = {
  home: HERO_MEDIA.home,
  itineraries: HERO_MEDIA.itineraries,
  about: HERO_MEDIA.about,
  contact: HERO_MEDIA.contact,
  faq: HERO_MEDIA.faq,
  blog: HERO_MEDIA.blog,
  "personalized-itineraries": HERO_MEDIA.personalizedItineraries,
};

const fallbackItineraries: MarketingItineraryCard[] = featuredItineraries.map((item) => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  country: item.country,
  duration: item.duration,
  price: item.price,
  image: item.image,
  excerpt: item.excerpt,
  category: item.category,
}));

const fallbackItineraryBySlug = new Map(
  fallbackItineraries.map((item) => [item.slug, item] as const),
);
const fallbackCountryBySlug = new Map(
  staticCountries.map((item) => [item.slug, item] as const),
);
const fallbackBlogBySlug = new Map(
  staticBlogPosts.map((post) => [post.slug, post] as const),
);

const fallbackGallery: MarketingGalleryCard[] = [
  {
    id: "fallback-imagine-1",
    src: "/images/imaginegallery/abruzzo.png",
    alt: "Abruzzo",
    location: "Abruzzo",
  },
  {
    id: "fallback-imagine-2",
    src: "/images/imaginegallery/castellmare%20di%20stabbia.png",
    alt: "Castellmare di Stabbia",
    location: "Castellmare di Stabbia",
  },
  {
    id: "fallback-imagine-3",
    src: "/images/imaginegallery/costiera%20amalfitana.png",
    alt: "Costiera Amalfitana",
    location: "Costiera Amalfitana",
  },
  {
    id: "fallback-imagine-4",
    src: "/images/imaginegallery/napoli.png",
    alt: "Costiera Amalfitana",
    location: "Costiera Amalfitana",
  },
  {
    id: "fallback-imagine-5",
    src: "/images/imaginegallery/romania.png",
    alt: "Romania",
    location: "Romania",
  },
  {
    id: "fallback-imagine-6",
    src: "/images/imaginegallery/romania2.png",
    alt: "Romania",
    location: "Romania",
  },
  {
    id: "fallback-imagine-7",
    src: "/images/imaginegallery/toscana.png",
    alt: "Toscana",
    location: "Toscana",
  },
];

async function marketingClient() {
  return (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
}

function titleCaseSlug(value: string | null) {
  if (!value) return "";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveCountryName(slug: string | null, fallback?: string) {
  if (fallback) return fallback;
  if (!slug) return "";
  return fallbackCountryBySlug.get(slug)?.name ?? titleCaseSlug(slug);
}

function resolveItineraryCardImage(
  heroImageUrl: string | null,
  fallbackImage?: string,
): string {
  if (heroImageUrl && heroImageUrl.trim()) {
    const resolved = resolveR2Url(heroImageUrl);
    // Guard against malformed keys accidentally producing unusable URLs.
    if (resolved && !/undefined|null/i.test(resolved)) return resolved;
  }
  if (fallbackImage && fallbackImage.trim()) return fallbackImage;
  return DEFAULT_ITINERARY_CARD_IMAGE;
}

function resolveText(value: string | null | undefined, fallback: string): string {
  const normalized = (value ?? "").trim();
  return normalized || fallback;
}

function normalizeSlugValue(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveHeroVideoSources(
  value: string | null | undefined,
): Pick<HeroMedia, "video" | "videoHls" | "videoPoster"> {
  const normalized = value?.trim();
  if (!normalized) return {};

  const stream = streamSourcesFromReference(normalized);
  if (stream) {
    return {
      video: stream.mp4Url,
      videoHls: stream.hlsUrl,
      videoPoster: stream.posterUrl,
    } satisfies Pick<HeroMedia, "video" | "videoHls" | "videoPoster">;
  }

  // If a bare token was intended as a Stream UID but Stream base is not set,
  // don't coerce it to an R2 key; let caller fall back to default hero media.
  const looksLikeBareReference = /^[a-zA-Z0-9_-]+$/.test(normalized);
  if (looksLikeBareReference) {
    return {};
  }

  const resolved = /^https?:\/\//i.test(normalized) ? normalized : resolveR2Url(normalized);
  if (/\.m3u8(\?|$)/i.test(resolved)) {
    return {
      videoHls: resolved,
    } satisfies Pick<HeroMedia, "video" | "videoHls" | "videoPoster">;
  }

  return {
    video: resolved,
  } satisfies Pick<HeroMedia, "video" | "videoHls" | "videoPoster">;
}

export async function loadHeroMediaByPageSlug(pageSlug: string): Promise<HeroMedia> {
  const fallback = fallbackHeroByPageSlug[pageSlug] ?? HERO_MEDIA.home;
  const supabase = await marketingClient();
  if (!supabase) return fallback;

  const { data } = await supabase
    .from("hero_media")
    .select("image_url, video_id")
    .eq("page_slug", pageSlug)
    .maybeSingle();

  if (!data) return fallback;
  const resolvedVideo = resolveHeroVideoSources(data.video_id);
  return {
    image: data.image_url ? resolveR2Url(data.image_url) : fallback.image,
    video: resolvedVideo.video ?? fallback.video,
    videoHls: resolvedVideo.videoHls ?? fallback.videoHls,
    videoPoster: resolvedVideo.videoPoster ?? fallback.videoPoster,
  };
}

export async function loadPublishedItineraryCards(
  limit?: number,
): Promise<MarketingItineraryCard[]> {
  const supabase = await marketingClient();
  // No DB connection → return empty list (NEVER static demo data on live site)
  if (!supabase) return [];

  const { data } = await supabase
    .from("itineraries")
    .select(
      "id, slug, title, excerpt, hero_image_url, country_slug, duration, price_cents, category, updated_at",
    )
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  // If DB has no published itineraries → return empty (no static fallback that confuses users)
  if (!(data ?? []).length) return [];

  const mapped = (data ?? []).map((row) => {
    const fallback = fallbackItineraryBySlug.get(row.slug);
    return {
      id: row.id,
      slug: row.slug,
      title: resolveText(row.title, fallback?.title ?? DEFAULT_ITINERARY_TITLE),
      country: resolveText(
        resolveCountryName(row.country_slug, fallback?.country),
        DEFAULT_ITINERARY_COUNTRY,
      ),
      duration: resolveText(row.duration, fallback?.duration ?? DEFAULT_ITINERARY_DURATION),
      price:
        row.price_cents != null ? Math.max(0, Math.round(row.price_cents / 100)) : fallback?.price ?? 0,
      image: resolveItineraryCardImage(row.hero_image_url, fallback?.image),
      excerpt: resolveText(row.excerpt, fallback?.excerpt ?? DEFAULT_ITINERARY_EXCERPT),
      category: row.category ?? fallback?.category,
    } satisfies MarketingItineraryCard;
  });
  return typeof limit === "number" ? mapped.slice(0, limit) : mapped;
}

export async function loadCountryCards(): Promise<MarketingCountryCard[]> {
  const staticCards = staticCountries.map((country) => ({
    slug: country.slug,
    name: country.name,
    tagline: country.tagline,
    image: country.image,
  }));

  const supabase = await marketingClient();
  if (!supabase) return staticCards;

  const { data } = await supabase
    .from("countries")
    .select("slug, name, tagline, cover_url, position")
    .order("position", { ascending: true });

  const dbRows = data ?? [];
  if (!dbRows.length) return staticCards;

  // Merge: DB rows take precedence; any static country not in DB is appended.
  const dbSlugs = new Set(dbRows.map((r) => r.slug));
  const dbCards: MarketingCountryCard[] = dbRows.map((row) => ({
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? fallbackCountryBySlug.get(row.slug)?.tagline ?? "",
    image: row.cover_url ? resolveR2Url(row.cover_url) : fallbackCountryBySlug.get(row.slug)?.image ?? "",
  }));
  const staticOnly = staticCards.filter((c) => !dbSlugs.has(c.slug));
  return [...dbCards, ...staticOnly];
}

function mapDbCountryRow(
  row: {
    slug: string;
    name: string;
    tagline: string | null;
    cover_url: string | null;
  },
  regions: Array<{
    slug: string;
    name: string;
    tagline: string | null;
    description: string | null;
    cover_url: string | null;
  }> = [],
): Country {
  const fallback = fallbackCountryBySlug.get(row.slug);
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? fallback?.tagline ?? "",
    image: row.cover_url
      ? resolveR2Url(row.cover_url)
      : fallback?.image ?? "",
    regions: regions.map((region) => ({
      slug: region.slug,
      name: region.name,
      tagline: region.tagline ?? "",
      description: region.description ?? undefined,
      image: region.cover_url
        ? resolveR2Url(region.cover_url)
        : fallback?.regions?.find((r) => r.slug === region.slug)?.image ?? "",
    })),
  };
}

export async function loadCountryDetail(slug: string): Promise<Country | null> {
  const fallback = staticCountries.find((c) => c.slug === slug) ?? null;
  const supabase = await marketingClient();
  if (!supabase) return fallback;

  const { data: row } = await supabase
    .from("countries")
    .select("slug, name, tagline, description, cover_url, position")
    .eq("slug", slug)
    .maybeSingle();

  if (!row) return fallback;

  const { data: regionRows } = await supabase
    .from("regions")
    .select("slug, name, tagline, description, cover_url, position")
    .eq("country_slug", slug)
    .order("position", { ascending: true });

  const mapped = mapDbCountryRow(row, regionRows ?? []);
  if (!mapped.regions?.length && fallback?.regions?.length) {
    mapped.regions = fallback.regions;
  }
  if (!mapped.image && fallback?.image) {
    mapped.image = fallback.image;
  }
  return mapped;
}

export async function loadRegionDetail(
  countrySlug: string,
  regionSlug: string,
): Promise<{ country: Country | null; region: Region | null }> {
  const country = await loadCountryDetail(countrySlug);
  if (!country) return { country: null, region: null };
  const region = country.regions?.find((r) => r.slug === regionSlug) ?? null;
  return { country, region };
}

export async function loadGalleryCards(limit?: number): Promise<MarketingGalleryCard[]> {
  const supabase = await marketingClient();
  if (!supabase) return typeof limit === "number" ? fallbackGallery.slice(0, limit) : fallbackGallery;

  const { data } = await supabase
    .from("gallery_items")
    .select("id, image_url, caption, location, position")
    .order("position", { ascending: true });

  if (!(data ?? []).length) {
    return typeof limit === "number" ? fallbackGallery.slice(0, limit) : fallbackGallery;
  }

  const mapped = (data ?? []).map((item) => ({
    id: item.id,
    src: resolveR2Url(item.image_url),
    alt: item.caption || item.location || "Travel gallery image",
    location: item.location || item.caption || "DEXTGO",
  }));
  return typeof limit === "number" ? mapped.slice(0, limit) : mapped;
}

export async function loadPublishedItineraryCardsByCountry(
  countrySlug: string,
): Promise<MarketingItineraryCard[]> {
  const supabase = await marketingClient();
  if (!supabase) return [];

  const normalizedSlug = normalizeSlugValue(countrySlug);

  const { data } = await supabase
    .from("itineraries")
    .select(
      "id, slug, title, excerpt, hero_image_url, country_slug, duration, price_cents, category, updated_at",
    )
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  const rows = (data ?? []).filter(
    (row) => normalizeSlugValue(row.country_slug) === normalizedSlug,
  );
  if (!rows.length) return [];

  return rows.map((row) => {
    const fallback = fallbackItineraryBySlug.get(row.slug);
    return {
      id: row.id,
      slug: row.slug,
      title: resolveText(row.title, fallback?.title ?? DEFAULT_ITINERARY_TITLE),
      country: resolveText(
        resolveCountryName(row.country_slug, fallback?.country),
        DEFAULT_ITINERARY_COUNTRY,
      ),
      duration: resolveText(row.duration, fallback?.duration ?? DEFAULT_ITINERARY_DURATION),
      price:
        row.price_cents != null ? Math.max(0, Math.round(row.price_cents / 100)) : fallback?.price ?? 0,
      image: resolveItineraryCardImage(row.hero_image_url, fallback?.image),
      excerpt: resolveText(row.excerpt, fallback?.excerpt ?? DEFAULT_ITINERARY_EXCERPT),
      category: row.category ?? fallback?.category,
    } satisfies MarketingItineraryCard;
  });
}

export async function loadPublishedItineraryCardsByRegion(
  countrySlug: string,
  regionSlug: string,
): Promise<MarketingItineraryCard[]> {
  const supabase = await marketingClient();
  if (!supabase) return [];

  const normalizedCountry = normalizeSlugValue(countrySlug);
  const normalizedRegion = normalizeSlugValue(regionSlug);

  const { data } = await supabase
    .from("itineraries")
    .select(
      "id, slug, title, excerpt, hero_image_url, country_slug, region_slug, duration, price_cents, category, updated_at",
    )
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  const rows = (data ?? []).filter(
    (row) =>
      normalizeSlugValue(row.country_slug) === normalizedCountry &&
      normalizeSlugValue(row.region_slug) === normalizedRegion,
  );
  if (!rows.length) return [];

  return rows.map((row) => {
    const fallback = fallbackItineraryBySlug.get(row.slug);
    return {
      id: row.id,
      slug: row.slug,
      title: resolveText(row.title, fallback?.title ?? DEFAULT_ITINERARY_TITLE),
      country: resolveText(
        resolveCountryName(row.country_slug, fallback?.country),
        DEFAULT_ITINERARY_COUNTRY,
      ),
      duration: resolveText(row.duration, fallback?.duration ?? DEFAULT_ITINERARY_DURATION),
      price:
        row.price_cents != null ? Math.max(0, Math.round(row.price_cents / 100)) : fallback?.price ?? 0,
      image: resolveItineraryCardImage(row.hero_image_url, fallback?.image),
      excerpt: resolveText(row.excerpt, fallback?.excerpt ?? DEFAULT_ITINERARY_EXCERPT),
      category: row.category ?? fallback?.category,
    } satisfies MarketingItineraryCard;
  });
}

export async function loadBlogSliderPosts(limit?: number): Promise<BlogPost[]> {
  const supabase = await marketingClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("blog_posts")
    .select("slug, title, excerpt, cover_url, category, published_at, status")
    .order("published_at", { ascending: false });

  const publishedRows = (data ?? []).filter(
    (row) => (row.status ?? "").toLowerCase() === "published",
  );
  // Empty DB → empty result (no static fallback that hides newly published posts)
  if (!publishedRows.length) return [];

  const mapped = publishedRows.map((row) => {
    const fallback = fallbackBlogBySlug.get(row.slug);
    const rawDate = row.published_at ?? fallback?.date ?? new Date().toISOString();
    return {
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? fallback?.excerpt ?? "",
      image: row.cover_url ? resolveR2Url(row.cover_url) : fallback?.image ?? "",
      date: rawDate,
      readTime: fallback?.readTime ?? "5 min read",
      category: row.category ?? fallback?.category ?? "Journal",
    } satisfies BlogPost;
  });

  return typeof limit === "number" ? mapped.slice(0, limit) : mapped;
}

export function fallbackCountryData(): Country[] {
  return staticCountries;
}
