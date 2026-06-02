import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPurchased } from "@/lib/purchases";

export const runtime = "nodejs";

interface PdfRouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * Temporary production handler while @react-pdf is moved off the 300MB
 * Vercel serverless limit. Auth/purchase checks stay in place.
 */
export async function GET(_request: NextRequest, ctx: PdfRouteContext) {
  const { slug } = await ctx.params;

  const supabase = (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  let itineraryId: string | null = null;

  if (supabase) {
    const { data: row } = await supabase
      .from("itineraries")
      .select("id")
      .ilike("slug", slug)
      .maybeSingle();
    itineraryId = row?.id ?? null;
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "auth-required", message: "Sign in to download itinerary PDFs." },
      { status: 401 },
    );
  }

  if (itineraryId && !user.is_admin && !(await hasPurchased(itineraryId, slug))) {
    return NextResponse.json(
      {
        error: "forbidden",
        message: "You can download a PDF only after purchasing this itinerary.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json(
    {
      error: "pdf-temporarily-unavailable",
      message:
        "PDF downloads are being re-enabled after deployment. Please try again shortly or contact support@dextgo.com.",
    },
    { status: 503 },
  );
}
