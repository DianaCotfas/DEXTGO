import { blogPosts } from "@/data/blog-posts";
import { featuredItineraries } from "@/data/itineraries";
import { ITINERARY_STEPS } from "@/data/itinerary-steps";
import type { Database, Json } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseReadMinutes(readTime: string): number | null {
  const match = readTime.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function buildCountryPayload() {
  const countries = new Map<string, Database["public"]["Tables"]["countries"]["Insert"]>();

  featuredItineraries.forEach((item, index) => {
    if (!item.countrySlug) return;
    if (countries.has(item.countrySlug)) return;

    countries.set(item.countrySlug, {
      slug: item.countrySlug,
      name: item.country ?? humanizeSlug(item.countrySlug),
      tagline: null,
      description: null,
      cover_url: null,
      position: index,
    });
  });

  return Array.from(countries.values());
}

function buildRegionPayload() {
  const regions = new Map<string, Database["public"]["Tables"]["regions"]["Insert"]>();

  featuredItineraries.forEach((item, index) => {
    if (!item.countrySlug || !item.regionSlug) return;
    const key = `${item.countrySlug}::${item.regionSlug}`;
    if (regions.has(key)) return;

    regions.set(key, {
      country_slug: item.countrySlug,
      slug: item.regionSlug,
      name: item.region ?? humanizeSlug(item.regionSlug),
      tagline: null,
      description: null,
      cover_url: null,
      position: index,
    });
  });

  return Array.from(regions.values());
}

function buildItineraryPayload() {
  return featuredItineraries.map((item) => ({
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt ?? null,
    description: item.description ?? null,
    sales_preview: item.salesPreview ?? null,
    preview_image_urls: item.previewImages ?? [],
    extras: (item.extras ?? null) as Json | null,
    hero_image_url: item.image ?? null,
    hero_video_id: item.heroVideoId ?? null,
    country_slug: item.countrySlug ?? null,
    region_slug: item.regionSlug ?? null,
    duration: item.duration ?? null,
    price_cents: Math.max(0, Math.round((item.price ?? 0) * 100)),
    currency: "eur",
    status: "published" as const,
    category: item.category ?? null,
    category_color: null,
  }));
}

function buildBlogPayload() {
  return blogPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? null,
    cover_url: post.image ?? null,
    category: post.category ?? null,
    read_minutes: parseReadMinutes(post.readTime),
    body: (post.body ?? []) as Json,
    seo_title: post.seoTitle ?? null,
    seo_description: post.seoDescription ?? null,
    published_at: post.date ? new Date(post.date).toISOString() : null,
    status: "published" as const,
  }));
}

export async function syncStaticContentToDatabase(
  supabase: SupabaseClient<Database>,
) {
  const countryPayload = buildCountryPayload();
  const regionPayload = buildRegionPayload();
  const itineraryPayload = buildItineraryPayload();
  const blogPayload = buildBlogPayload();

  const countryRes =
    countryPayload.length > 0
      ? await supabase
          .from("countries")
          .upsert(countryPayload, { onConflict: "slug" })
      : { error: null };
  if (countryRes.error) throw countryRes.error;

  const regionRes =
    regionPayload.length > 0
      ? await supabase
          .from("regions")
          .upsert(regionPayload, { onConflict: "country_slug,slug" })
      : { error: null };
  if (regionRes.error) throw regionRes.error;

  const [itineraryRes, blogRes] = await Promise.all([
    supabase.from("itineraries").upsert(itineraryPayload, { onConflict: "slug" }),
    supabase.from("blog_posts").upsert(blogPayload, { onConflict: "slug" }),
  ]);

  if (itineraryRes.error) throw itineraryRes.error;
  if (blogRes.error) throw blogRes.error;

  const itinerarySlugs = featuredItineraries.map((item) => item.slug);
  const { data: seededItineraries, error: seededItinerariesError } = await supabase
    .from("itineraries")
    .select("id, slug")
    .in("slug", itinerarySlugs);
  if (seededItinerariesError) throw seededItinerariesError;

  for (const itinerary of seededItineraries ?? []) {
    const staticSteps = ITINERARY_STEPS[itinerary.slug] ?? [];
    if (staticSteps.length === 0) continue;

    // Preserve CMS edits: only seed when itinerary has no saved steps yet.
    const { count, error: countError } = await supabase
      .from("itinerary_steps")
      .select("id", { count: "exact", head: true })
      .eq("itinerary_id", itinerary.id);
    if (countError) throw countError;
    if ((count ?? 0) > 0) continue;

    const stepsPayload: Database["public"]["Tables"]["itinerary_steps"]["Insert"][] =
      staticSteps.map((step) => ({
        itinerary_id: itinerary.id,
        position: step.position,
        kind: step.kind,
        title: step.title,
        body: step.body ?? null,
        lat: step.coords?.lat ?? null,
        lng: step.coords?.lng ?? null,
        audio_url: step.audioUrl ?? null,
        audio_duration_seconds: step.audioDurationSeconds ?? null,
        image_urls: step.images ?? [],
        day: step.day ?? null,
        day_title: step.dayTitle ?? null,
        official_url: step.officialUrl ?? null,
        google_maps_url: step.googleMapsUrl ?? null,
        address: step.address ?? null,
        day_intro: step.dayIntro ?? null,
        info_data: step.infoData ?? null,
        description_long: step.descriptionAndAudio ?? null,
        description_kids: step.descriptionAndAudioKids ?? null,
        expert_tips: step.expertTips ?? null,
      }));

    const { error: stepInsertError } = await supabase
      .from("itinerary_steps")
      .insert(stepsPayload);
    if (stepInsertError) throw stepInsertError;
  }
}
