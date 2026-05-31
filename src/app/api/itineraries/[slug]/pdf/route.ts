import { NextResponse, type NextRequest } from "next/server";
import { renderToStream, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { ItineraryPdf } from "@/components/itinerary/itinerary-pdf";
import { featuredItineraries } from "@/data/itineraries";
import { ITINERARY_STEPS } from "@/data/itinerary-steps";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPurchased } from "@/lib/purchases";
import { resolvePdfImage, resolvePdfImages } from "@/lib/pdf-images";
import type { ItineraryStep, ItineraryExtras } from "@/types";

export const runtime = "nodejs";

interface PdfRouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, ctx: PdfRouteContext) {
  const { slug } = await ctx.params;
  const staticSteps = ITINERARY_STEPS[slug] ?? [];

  // Use admin client for PDF generation so RLS never blocks step reads
  const supabase = (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  let it: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    description: string | null;
    duration: string | null;
    country_slug: string | null;
    region_slug: string | null;
    hero_image_url: string | null;
    extras: ItineraryExtras | null;
  } | null = null;
  let steps: ItineraryStep[] = [];

  if (supabase) {
    const { data: row, error: itineraryErr } = await supabase
      .from("itineraries")
      .select(
        "id, slug, title, excerpt, description, duration, country_slug, region_slug, hero_image_url, extras",
      )
      .ilike("slug", slug)
      .maybeSingle();
    if (itineraryErr) {
      console.error("[PDF route] itinerary query error", { slug, message: itineraryErr.message });
    }
    if (!row) {
      console.log("[PDF route] no itinerary found for slug", { slug });
    }
    if (row) {
      it = {
        ...row,
        extras: (row.extras as ItineraryExtras | null) ?? null,
      };
      const { data: stepRows, error: stepsErr } = await supabase
        .from("itinerary_steps")
        .select("*")
        .eq("itinerary_id", row.id)
        .order("day", { ascending: true, nullsFirst: false })
        .order("position");
      if (stepsErr) {
        console.error("[PDF route] steps query error", {
          slug,
          itineraryId: row.id,
          message: stepsErr.message,
        });
      } else {
        console.log("[PDF route] steps loaded", { slug, itineraryId: row.id, count: stepRows?.length ?? 0 });
      }
      steps = (stepRows ?? []).map((s) => ({
        id: s.id,
        position: s.position,
        kind: s.kind,
        title: s.title,
        body: s.body ?? undefined,
        descriptionAndAudio: s.description_long ?? undefined,
        infoData: s.info_data ?? undefined,
        expertTips: s.expert_tips ?? undefined,
        images: s.image_urls ?? undefined,
        coords:
          s.lat != null && s.lng != null ? { lat: s.lat, lng: s.lng } : undefined,
        audioUrl: s.audio_url ?? undefined,
        audioDurationSeconds: s.audio_duration_seconds ?? undefined,
        day: s.day ?? undefined,
        dayTitle: s.day_title ?? undefined,
        officialUrl: s.official_url ?? undefined,
        googleMapsUrl: s.google_maps_url ?? undefined,
        address: s.address ?? undefined,
      }));
      if (steps.length === 0) {
        steps = staticSteps;
      }
    }
  }

  if (!it) {
    const fallback = featuredItineraries.find((i) => i.slug === slug);
    if (!fallback) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    it = {
      id: fallback.id,
      slug: fallback.slug,
      title: fallback.title,
      excerpt: fallback.excerpt,
      description: fallback.description ?? null,
      duration: fallback.duration,
      country_slug: fallback.countrySlug ?? fallback.country,
      region_slug: fallback.regionSlug ?? fallback.region,
      hero_image_url: fallback.image,
      extras: fallback.extras ?? null,
    };
    steps = staticSteps;
  }

  steps = steps.map((step, index) => {
    const fallback = staticSteps[index];
    const coords = step.coords ?? fallback?.coords;
    const fallbackMapImage = coords
      ? `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=14&size=1000x500&markers=${coords.lat},${coords.lng},red-pushpin`
      : undefined;
    return {
      ...step,
      images:
        step.images?.length || fallback?.images?.length
          ? (step.images?.length ? step.images : fallback?.images)
          : fallbackMapImage
            ? [fallbackMapImage]
            : undefined,
      coords,
      googleMapsUrl: step.googleMapsUrl ?? fallback?.googleMapsUrl,
      officialUrl: step.officialUrl ?? fallback?.officialUrl,
      address: step.address ?? fallback?.address,
    };
  });

  steps = await Promise.all(
    steps.map(async (step) => ({
      ...step,
      images: await resolvePdfImages(step.images),
    })),
  );

  const resolvedCover = await resolvePdfImage(it.hero_image_url);

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "auth-required", message: "Sign in to download itinerary PDFs." },
      { status: 401 },
    );
  }
  const allowed = user.is_admin || (await hasPurchased(it.id, it.slug));
  if (!allowed) {
    return NextResponse.json(
      {
        error: "forbidden",
        message: "You can download a PDF only after purchasing this itinerary.",
      },
      { status: 403 },
    );
  }

  if (steps.length === 0) {
    // Mobile Safari users were getting blocked by a hard 409.
    // Always generate a valid PDF, even when step content is empty.
    steps = [
      {
        id: "placeholder",
        position: 0,
        kind: "step",
        title: user.is_admin
          ? "No steps added yet"
          : "Your itinerary is being finalized",
        body: user.is_admin
          ? "This itinerary currently has no saved steps in the CMS. Add content, then regenerate."
          : "We are finalizing your itinerary details. Please check back shortly.",
      },
    ];
  }

  const element = createElement(ItineraryPdf, {
    itinerary: {
      title: it.title,
      excerpt: it.excerpt,
      description: it.description,
      duration: it.duration,
      country: it.country_slug,
      region: it.region_slug,
      cover_url: resolvedCover,
      extras: it.extras,
    },
    steps,
  }) as unknown as ReactElement<DocumentProps>;
  try {
    const stream = await renderToStream(element);
    return new Response(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="dextgo-${slug}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation failed", { slug, error });
    return NextResponse.json(
      {
        error: "pdf-generation-failed",
        message:
          "We couldn't generate this PDF right now. Please try again in a minute.",
      },
      { status: 500 },
    );
  }
}

