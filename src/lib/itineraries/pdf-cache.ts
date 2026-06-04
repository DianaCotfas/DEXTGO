import { createElement, type ReactElement } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { featuredItineraries } from "@/data/itineraries";
import { ITINERARY_STEPS } from "@/data/itinerary-steps";
import { isConfigured } from "@/lib/env";
import { resolvePdfImage, resolvePdfImages } from "@/lib/pdf-images";
import { resolveR2Url, uploadToR2 } from "@/lib/r2";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { ItineraryExtras, ItineraryStep } from "@/types";

type SupabaseLike = SupabaseClient<Database>;

type ItineraryRow = Database["public"]["Tables"]["itineraries"]["Row"];
type StepRow = Database["public"]["Tables"]["itinerary_steps"]["Row"];
type DocumentProps = import("@react-pdf/renderer").DocumentProps;

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function buildPdfKey(itineraryId: string) {
  return `itineraries/pdf/${itineraryId}.pdf`;
}

function mapDbStepToPdfStep(step: StepRow): ItineraryStep {
  const coords =
    step.lat != null && step.lng != null ? { lat: step.lat, lng: step.lng } : undefined;
  const fallbackMapImage = coords
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=14&size=1000x500&markers=${coords.lat},${coords.lng},red-pushpin`
    : undefined;
  const rawImages = (step.image_urls ?? []).map((value) => resolveR2Url(value)).filter(Boolean);

  return {
    id: step.id,
    position: step.position,
    kind: step.kind,
    title: step.title,
    body: step.body ?? undefined,
    descriptionAndAudio: step.description_long ?? undefined,
    infoData: step.info_data ?? undefined,
    expertTips: step.expert_tips ?? undefined,
    images: rawImages.length > 0 ? rawImages : fallbackMapImage ? [fallbackMapImage] : undefined,
    coords,
    audioUrl: step.audio_url ? resolveR2Url(step.audio_url) : undefined,
    audioDurationSeconds: step.audio_duration_seconds ?? undefined,
    day: step.day ?? undefined,
    dayTitle: step.day_title ?? undefined,
    officialUrl: step.official_url ?? undefined,
    googleMapsUrl: step.google_maps_url ?? undefined,
    address: step.address ?? undefined,
  };
}

async function resolveStepImages(steps: ItineraryStep[]) {
  return Promise.all(
    steps.map(async (step) => ({
      ...step,
      images: await resolvePdfImages(step.images),
    })),
  );
}

async function buildPdfBytes(opts: {
  itinerary: {
    title: string;
    excerpt: string | null;
    description: string | null;
    duration: string | null;
    country: string | null;
    region: string | null;
    coverUrl: string | null;
    extras: ItineraryExtras | null;
  };
  steps: ItineraryStep[];
}) {
  const [{ renderToBuffer }, { ItineraryPdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/itinerary/itinerary-pdf"),
  ]);

  const element = createElement(ItineraryPdf, {
    itinerary: {
      title: opts.itinerary.title,
      excerpt: opts.itinerary.excerpt,
      description: opts.itinerary.description,
      duration: opts.itinerary.duration,
      country: opts.itinerary.country,
      region: opts.itinerary.region,
      cover_url: opts.itinerary.coverUrl,
      extras: opts.itinerary.extras,
    },
    steps: opts.steps,
  }) as unknown as ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}

async function getClient(existing?: SupabaseLike) {
  if (existing) return existing;
  return (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
}

export async function regenerateItineraryPdf(itineraryId: string, supabase?: SupabaseLike) {
  if (!isConfigured("r2")) return null;

  const client = await getClient(supabase);
  if (!client) throw new Error("Supabase not configured");

  const { data: itinerary, error: itineraryError } = await client
    .from("itineraries")
    .select(
      "id,slug,title,excerpt,description,duration,country_slug,region_slug,hero_image_url,extras",
    )
    .eq("id", itineraryId)
    .maybeSingle();
  if (itineraryError) throw itineraryError;
  if (!itinerary) return null;

  const fallbackItinerary = featuredItineraries.find((item) => item.slug === itinerary.slug);
  const staticSteps = ITINERARY_STEPS[itinerary.slug] ?? [];

  const { data: steps, error: stepsError } = await client
    .from("itinerary_steps")
    .select("*")
    .eq("itinerary_id", itinerary.id)
    .order("day", { ascending: true, nullsFirst: true })
    .order("position", { ascending: true });
  if (stepsError) throw stepsError;

  const dbSteps = ((steps ?? []) as StepRow[]).map((step) => mapDbStepToPdfStep(step));
  const resolvedSteps = await resolveStepImages(dbSteps.length > 0 ? dbSteps : staticSteps);
  const coverCandidate = itinerary.hero_image_url
    ? resolveR2Url(itinerary.hero_image_url)
    : fallbackItinerary?.image ?? null;
  const coverUrl = await resolvePdfImage(coverCandidate);

  const bytes = await buildPdfBytes({
    itinerary: {
      title: normalizeText(itinerary.title) || fallbackItinerary?.title || "Untitled itinerary",
      excerpt: itinerary.excerpt ?? fallbackItinerary?.excerpt ?? null,
      description: itinerary.description ?? fallbackItinerary?.description ?? null,
      duration: itinerary.duration ?? fallbackItinerary?.duration ?? null,
      country: itinerary.country_slug ?? fallbackItinerary?.country ?? null,
      region: itinerary.region_slug ?? fallbackItinerary?.region ?? null,
      coverUrl,
      extras: (itinerary.extras as ItineraryExtras | null) ?? fallbackItinerary?.extras ?? null,
    },
    steps: resolvedSteps,
  });

  const key = buildPdfKey(itinerary.id);
  await uploadToR2({
    key,
    body: bytes,
    contentType: "application/pdf",
    cacheControl: "private, max-age=300",
  });

  const generatedAt = new Date().toISOString();
  const { error: updateError } = await client
    .from("itineraries")
    .update({ pdf_r2_key: key, pdf_generated_at: generatedAt })
    .eq("id", itinerary.id);
  if (updateError) throw updateError;

  return { key, generatedAt };
}

export async function regenerateItineraryPdfSilently(
  itineraryId: string,
  supabase?: SupabaseLike,
) {
  try {
    return await regenerateItineraryPdf(itineraryId, supabase);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown itinerary PDF generation failure.";
    console.error("[itinerary-pdf-cache] generation failed", itineraryId, message);
    return null;
  }
}
