import { featuredItineraries } from "@/data/itineraries";
import { ITINERARY_STEPS } from "@/data/itinerary-steps";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveR2Url } from "@/lib/r2";
import { resolveStreamUrl } from "@/lib/stream";
import type { Itinerary, ItineraryExtras, ItineraryStep } from "@/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveImage(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return resolveR2Url(value);
}

function resolveImageList(values: string[] | null | undefined): string[] {
  if (!values || values.length === 0) return [];
  return values.map((v) => resolveR2Url(v)).filter(Boolean);
}

function resolveVideo(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//.test(value)) return value;
  // Looks like a path/key: treat as media object reference.
  if (value.includes("/") || value.includes(".")) return resolveR2Url(value);
  // Otherwise attempt Cloudflare Stream UID resolution.
  return resolveStreamUrl(value) ?? undefined;
}

interface LoadedItinerary {
  itinerary: Itinerary;
  steps: ItineraryStep[];
}

export async function loadItineraryBySlug(slug: string): Promise<LoadedItinerary | null> {
  const fallback = featuredItineraries.find((i) => i.slug === slug);
  const fallbackSteps = ITINERARY_STEPS[slug] ?? [];

  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());

  if (!supabase) {
    if (!fallback) return null;
    return { itinerary: fallback, steps: fallbackSteps };
  }

  const { data: dbItinerary } = await supabase
    .from("itineraries")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!dbItinerary) {
    if (!fallback) return null;
    return { itinerary: fallback, steps: fallbackSteps };
  }

  // Visibility policy:
  // - published => public
  // - draft => admin-only (client must never see work-in-progress)
  // - archived => "completed private delivery": accessible only to admin or paid user
  if (dbItinerary.status !== "published") {
    const user = await getCurrentUser();
    if (user?.is_admin) {
      // Admins can always open non-published itineraries.
    } else if (dbItinerary.status === "draft") {
      // Never expose draft itineraries to clients.
      return null;
    } else {
      // Archived/private-completed itineraries are visible only to paid users.
      if (!user) return null;
      const scoped = await createSupabaseServerClient();
      if (!scoped) return null;

      const matchBy =
        dbItinerary.slug && UUID_RE.test(dbItinerary.id)
          ? `itinerary_id.eq.${dbItinerary.id},itinerary_slug.eq.${dbItinerary.slug}`
          : `itinerary_id.eq.${dbItinerary.id}`;

      const { data: order } = await scoped
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .or(matchBy)
        .limit(1)
        .maybeSingle();
      if (!order) return null;
    }
  }

  const { data: dbSteps } = await supabase
    .from("itinerary_steps")
    .select("*")
    .eq("itinerary_id", dbItinerary.id)
    .order("position");

  const merged: Itinerary = {
    id: dbItinerary.id,
    slug: dbItinerary.slug,
    title: dbItinerary.title,
    country: fallback?.country ?? dbItinerary.country_slug ?? "",
    countrySlug: dbItinerary.country_slug ?? fallback?.countrySlug,
    region: fallback?.region ?? dbItinerary.region_slug ?? "",
    regionSlug: dbItinerary.region_slug ?? fallback?.regionSlug,
    duration: dbItinerary.duration ?? fallback?.duration ?? "",
    price: dbItinerary.price_cents ? dbItinerary.price_cents / 100 : fallback?.price ?? 0,
    image: resolveImage(dbItinerary.hero_image_url) ?? fallback?.image ?? "",
    excerpt: dbItinerary.excerpt ?? fallback?.excerpt ?? "",
    description: dbItinerary.description ?? fallback?.description,
    salesPreview: dbItinerary.sales_preview ?? fallback?.salesPreview,
    previewImages:
      resolveImageList(dbItinerary.preview_image_urls).length > 0
        ? resolveImageList(dbItinerary.preview_image_urls)
        : fallback?.previewImages,
    extras: (dbItinerary.extras as ItineraryExtras | null) ?? fallback?.extras,
    heroVideoId:
      resolveVideo(dbItinerary.hero_video_id) ?? resolveVideo(fallback?.heroVideoId),
    category: dbItinerary.category ?? fallback?.category,
  };

  const mergedSteps: ItineraryStep[] = (dbSteps ?? []).length
    ? (dbSteps ?? []).map((s, idx) => ({
        id: s.id,
        position: s.position ?? idx,
        kind: s.kind,
        title: s.title,
        body: s.body ?? undefined,
        coords: s.lat != null && s.lng != null ? { lat: s.lat, lng: s.lng } : undefined,
        audioUrl: s.audio_url ? resolveR2Url(s.audio_url) : undefined,
        audioDurationSeconds: s.audio_duration_seconds ?? undefined,
        images: resolveImageList(s.image_urls),
        day: s.day ?? undefined,
        dayTitle: s.day_title ?? undefined,
        dayIntro: s.day_intro ?? undefined,
        officialUrl: s.official_url ?? undefined,
        googleMapsUrl: s.google_maps_url ?? undefined,
        address: s.address ?? undefined,
        infoData: s.info_data ?? undefined,
        descriptionAndAudio: s.description_long ?? undefined,
        descriptionAndAudioKids: s.description_kids ?? undefined,
        expertTips: s.expert_tips ?? undefined,
      }))
    : fallbackSteps;

  return { itinerary: merged, steps: mergedSteps };
}
