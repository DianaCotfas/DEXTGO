import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStripe, isStripeConfigured, siteUrl } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { featuredItineraries } from "@/data/itineraries";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const Body = z.object({ itinerarySlug: z.string().min(1) });

export async function POST(request: NextRequest) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: "bad-request", message: "Missing itinerarySlug" },
      { status: 400 },
    );
  }
  const { itinerarySlug } = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { code: "auth-required", message: "Sign in to purchase" },
      { status: 401 },
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        code: "not-configured",
        message:
          "Stripe is not configured yet. Once Diana shares the keys, this checkout becomes live automatically.",
      },
      { status: 503 },
    );
  }

  // Lookup itinerary — prefer DB, fall back to static data during migration.
  const supabase = await createSupabaseAdminClient();
  let itinerary: {
    id: string;
    slug: string;
    title: string;
    price_cents: number;
    currency: string;
    excerpt: string | null;
    hero_image_url: string | null;
  } | null = null;

  if (supabase) {
    const { data } = await supabase
      .from("itineraries")
      .select("id, slug, title, price_cents, currency, excerpt, hero_image_url")
      .eq("slug", itinerarySlug)
      .maybeSingle();
    if (data) itinerary = data;
  }

  if (!itinerary) {
    const fallback = featuredItineraries.find((i) => i.slug === itinerarySlug);
    if (!fallback) {
      return NextResponse.json(
        { code: "not-found", message: "Unknown itinerary" },
        { status: 404 },
      );
    }
    itinerary = {
      id: fallback.id,
      slug: fallback.slug,
      title: fallback.title,
      price_cents: fallback.price * 100,
      currency: "eur",
      excerpt: fallback.excerpt,
      hero_image_url: fallback.image,
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { code: "not-configured", message: "Stripe client unavailable" },
      { status: 503 },
    );
  }

  const productImage =
    itinerary.hero_image_url?.startsWith("http://") ||
    itinerary.hero_image_url?.startsWith("https://")
      ? itinerary.hero_image_url
      : undefined;

  const session = await createCheckoutSession({
    stripe,
    itinerary,
    productImage,
    user,
    request,
  });

  return NextResponse.json({ url: session.url });
}

async function createCheckoutSession({
  stripe,
  itinerary,
  productImage,
  user,
  request,
}: {
  stripe: NonNullable<ReturnType<typeof getStripe>>;
  itinerary: {
    id: string;
    slug: string;
    title: string;
    price_cents: number;
    currency: string;
    excerpt: string | null;
    hero_image_url: string | null;
  };
  productImage: string | undefined;
  user: { id: string; email?: string | null };
  request: NextRequest;
}) {
  const baseParams = {
    mode: "payment" as const,
    customer_email: user.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: itinerary.currency,
          unit_amount: itinerary.price_cents,
          product_data: {
            name: itinerary.title,
            description: itinerary.excerpt ?? undefined,
            images: productImage ? [productImage] : undefined,
          },
        },
      },
    ],
    metadata: {
      itinerary_id: itinerary.id,
      itinerary_slug: itinerary.slug,
      user_id: user.id,
    },
    success_url: `${siteUrl()}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/itineraries/${itinerary.slug}?canceled=1`,
    locale: inferCheckoutLocale(request.headers.get("accept-language")),
    payment_intent_data: {
      metadata: {
        itinerary_id: itinerary.id,
        itinerary_slug: itinerary.slug,
        user_id: user.id,
      },
    },
  };

  try {
    // Faster path: request card+paypal immediately (avoids slow failed dynamic retry).
    return stripe.checkout.sessions.create({
      ...baseParams,
      payment_method_types: ["card", "paypal"],
    });
  } catch (paypalError) {
    const paypalMessage =
      paypalError instanceof Error ? paypalError.message : String(paypalError);
    console.warn(
      "[checkout] paypal-unavailable, falling back to card-only",
      paypalMessage,
    );
    return stripe.checkout.sessions.create({
      ...baseParams,
      payment_method_types: ["card"],
    });
  }
}

function inferCheckoutLocale(
  acceptLanguage: string | null,
): "auto" | "it" | "ro" | "fr" | "de" | "es" {
  const lower = acceptLanguage?.toLowerCase() ?? "";
  if (lower.startsWith("it")) return "it";
  if (lower.startsWith("ro")) return "ro";
  if (lower.startsWith("fr")) return "fr";
  if (lower.startsWith("de")) return "de";
  if (lower.startsWith("es")) return "es";
  return "auto";
}
