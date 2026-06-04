import { NextResponse, type NextRequest } from "next/server";
import { Readable } from "node:stream";
import { getCurrentUser } from "@/lib/auth";
import { hasPurchased } from "@/lib/purchases";
import { loadItineraryBySlug } from "@/lib/itineraries/loader";
import { getPublicSiteUrl } from "@/lib/site-url";
import { getFromR2 } from "@/lib/r2";
import { isConfigured } from "@/lib/env";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

interface PdfRouteContext {
  params: Promise<{ slug: string }>;
}

function safeFilename(slug: string) {
  const cleaned = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "itinerary";
}

async function loadStoredPdfState(slug: string) {
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("itineraries")
    .select("pdf_r2_key")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[itinerary-pdf] failed to read stored PDF key", slug, error.message);
    return null;
  }
  if (!data) return null;

  return {
    key: data.pdf_r2_key ?? null,
  };
}

async function streamStoredPdf(key: string, filename: string) {
  const object = await getFromR2(key);
  if (!object.Body) return null;

  const body = object.Body as {
    transformToWebStream?: () => ReadableStream;
  } & NodeJS.ReadableStream;
  const stream =
    typeof body.transformToWebStream === "function"
      ? body.transformToWebStream()
      : (Readable.toWeb(body as Readable) as ReadableStream);

  const headers = new Headers();
  headers.set("Content-Type", object.ContentType ?? "application/pdf");
  headers.set("Content-Disposition", `attachment; filename="${filename}.pdf"`);
  headers.set("Cache-Control", "private, no-store");
  if (typeof object.ContentLength === "number") {
    headers.set("Content-Length", String(object.ContentLength));
  }

  return new Response(stream, {
    status: 200,
    headers,
  });
}

export async function GET(_request: NextRequest, ctx: PdfRouteContext) {
  const { slug } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "auth-required", message: "Sign in to download itinerary PDFs." },
      { status: 401 },
    );
  }

  const loaded = await loadItineraryBySlug(slug);
  if (!loaded) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const allowed =
    user.is_admin ||
    (await hasPurchased(loaded.itinerary.id, loaded.itinerary.slug));
  if (!allowed) {
    return NextResponse.json(
      {
        error: "forbidden",
        message: "You can download a PDF only after purchasing this itinerary.",
      },
      { status: 403 },
    );
  }

  if (isConfigured("r2")) {
    const state = await loadStoredPdfState(slug);
    if (state) {
      const filename = safeFilename(slug);
      if (state.key) {
        try {
          const streamed = await streamStoredPdf(state.key, filename);
          if (streamed) return streamed;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown R2 download error.";
          console.error("[itinerary-pdf] failed to stream stored PDF", slug, message);
        }
      }
    }
  }

  const printUrl = `${getPublicSiteUrl()}/itineraries/${slug}/print`;
  return NextResponse.redirect(printUrl, 302);
}
