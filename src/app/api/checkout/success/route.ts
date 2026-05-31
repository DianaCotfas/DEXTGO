import { NextResponse, type NextRequest } from "next/server";
import { getStripe, siteUrl } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const fallbackUrl = `${siteUrl()}/account/itineraries`;

  if (!sessionId) {
    return NextResponse.redirect(`${fallbackUrl}?checkout=missing-session`);
  }

  const stripe = getStripe();
  const supabase = await createSupabaseAdminClient();
  if (!stripe || !supabase) {
    return NextResponse.redirect(`${fallbackUrl}?checkout=not-configured`);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const itinerarySlug = session.metadata?.itinerary_slug ?? null;

  if (session.payment_status !== "paid") {
    return NextResponse.redirect(
      `${fallbackUrl}?checkout=processing`,
    );
  }

  let itineraryId =
    session.metadata?.itinerary_id && UUID_RE.test(session.metadata.itinerary_id)
      ? session.metadata.itinerary_id
      : null;

  if (!itineraryId && itinerarySlug) {
    const { data: itineraryBySlug } = await supabase
      .from("itineraries")
      .select("id")
      .eq("slug", itinerarySlug)
      .maybeSingle();
    itineraryId = itineraryBySlug?.id ?? null;
  }

  const email = session.customer_details?.email ?? session.customer_email ?? "";
  const userId = session.metadata?.user_id ?? null;

  await supabase.from("orders").upsert(
    {
      stripe_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      user_id: userId,
      email,
      itinerary_id: itineraryId,
      itinerary_slug: itinerarySlug,
      amount_cents: session.amount_total ?? 0,
      currency: (session.currency ?? "eur").toLowerCase(),
      status: "paid",
    },
    { onConflict: "stripe_session_id" },
  );

  const purchased = itinerarySlug ? `?purchased=${itinerarySlug}` : "?purchased=1";
  return NextResponse.redirect(`${fallbackUrl}${purchased}`);
}
