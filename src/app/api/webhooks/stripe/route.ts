import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { env, isConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  sendCustomItineraryPaidConfirmationEmail,
  sendOrderConfirmationEmail,
} from "@/lib/email";
import type Stripe from "stripe";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CUSTOM_DELIVERY_ESTIMATE_FALLBACK =
  process.env.CUSTOM_ITINERARY_DELIVERY_ESTIMATE ?? "1-3 business days";

export async function POST(request: NextRequest) {
  if (!isConfigured("stripeWebhook")) {
    return NextResponse.json(
      { ok: false, error: "stripe-webhook-not-configured" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "no-signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `bad-signature: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = await createSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "supabase-not-configured" },
        { status: 503 },
      );
    }

    const metadata = session.metadata ?? {};
    const isCustomRequest = metadata.custom_request === "true";
    const customRequestId = metadata.custom_request_id;
    const itinerarySlug = metadata.itinerary_slug ?? null;
    let itineraryId =
      metadata.itinerary_id && UUID_RE.test(metadata.itinerary_id)
        ? metadata.itinerary_id
        : null;
    const userId = metadata.user_id;
    const email = session.customer_details?.email ?? session.customer_email ?? "";
    const amount = session.amount_total ?? 0;
    const currency = (session.currency ?? "eur").toLowerCase();

    if (!itineraryId && itinerarySlug) {
      const { data: itineraryBySlug } = await supabase
        .from("itineraries")
        .select("id")
        .eq("slug", itinerarySlug)
        .maybeSingle();
      itineraryId = itineraryBySlug?.id ?? null;
    }

    const orderStatus: "paid" | "pending" | "failed" =
      event.type === "checkout.session.async_payment_failed"
        ? "failed"
        : session.payment_status === "paid" ||
            event.type === "checkout.session.async_payment_succeeded"
          ? "paid"
          : "pending";

    const { error: upsertError } = await supabase.from("orders").upsert(
      {
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        user_id: userId ?? null,
        email,
        itinerary_id: itineraryId ?? null,
        itinerary_slug: itinerarySlug,
        amount_cents: amount,
        currency,
        status: orderStatus,
      },
      { onConflict: "stripe_session_id" },
    );
    if (upsertError) {
      return NextResponse.json(
        { ok: false, error: `orders-upsert-failed:${upsertError.message}` },
        { status: 500 },
      );
    }

    if (orderStatus === "paid" && isCustomRequest) {
      if (customRequestId && UUID_RE.test(customRequestId)) {
        const { data: requestMessage } = await supabase
          .from("contact_messages")
          .select("id, subject, message")
          .eq("id", customRequestId)
          .maybeSingle();
        if (requestMessage) {
          const paidTag = "(paid)";
          const nextSubject = requestMessage.subject?.includes(paidTag)
            ? requestMessage.subject
            : `${requestMessage.subject ?? "Personalized itinerary request"} ${paidTag}`;
          const paymentLine = `\nPayment status: paid via Stripe (${amount} ${currency.toUpperCase()})`;
          const nextMessage = (requestMessage.message ?? "").includes("Payment status: paid")
            ? requestMessage.message
            : `${requestMessage.message ?? ""}${paymentLine}`;
          await supabase
            .from("contact_messages")
            .update({ subject: nextSubject, message: nextMessage })
            .eq("id", customRequestId);
        }
      }

      if (email) {
        try {
          await sendCustomItineraryPaidConfirmationEmail({
            to: email,
            name: metadata.requester_name,
            destination: metadata.destination,
            amountCents: amount,
            currency,
            deliveryEstimate: metadata.delivery_eta || CUSTOM_DELIVERY_ESTIMATE_FALLBACK,
          });
        } catch (err) {
          console.error("[stripe-webhook] custom-itinerary-confirmation-email-failed", err);
        }
      }
    } else if (orderStatus === "paid" && (itineraryId || itinerarySlug)) {
      const { data: itinerary } = await supabase
        .from("itineraries")
        .select("title, slug")
        .or(
          itineraryId
            ? `id.eq.${itineraryId},slug.eq.${itinerarySlug ?? ""}`
            : `slug.eq.${itinerarySlug ?? ""}`,
        )
        .maybeSingle();
      if (email && itinerary) {
        // Email should not block webhook acknowledgement.
        try {
          await sendOrderConfirmationEmail({
            to: email,
            itineraryTitle: itinerary.title,
            itinerarySlug: itinerary.slug,
            amountCents: amount,
            currency,
          });
        } catch (err) {
          console.error("[stripe-webhook] confirmation-email-failed", err);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, received: event.type });
}
