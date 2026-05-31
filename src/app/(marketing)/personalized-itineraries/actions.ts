"use server";

import {
  itineraryRequestSchema,
  type ItineraryRequestData,
} from "@/lib/validations";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendAdminNotificationEmail, sendItineraryRequestConfirmationEmail } from "@/lib/email";

type SubmitItineraryRequestResult = {
  success: boolean;
  error?: string;
  savedToCms?: boolean;
  warnings?: string[];
};

const CUSTOM_ITINERARY_PRICE_CENTS = Math.max(
  100,
  Number.parseInt(process.env.CUSTOM_ITINERARY_PRICE_CENTS ?? "14900", 10) || 14900,
);
const CUSTOM_ITINERARY_CURRENCY = (process.env.CUSTOM_ITINERARY_CURRENCY ?? "eur").toLowerCase();
const CUSTOM_ITINERARY_DELIVERY_ESTIMATE =
  process.env.CUSTOM_ITINERARY_DELIVERY_ESTIMATE ?? "1 to 5 days";

const trimTo = (value: string, max: number) => value.slice(0, max);

export async function submitItineraryRequest(data: ItineraryRequestData) {
  const parsed = itineraryRequestSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid form data" } satisfies SubmitItineraryRequestResult;
  }

  const d = parsed.data;
  const summary = [
    `Destination: ${d.destination}`,
    `Trip type: ${d.tripType}`,
    `Dates: ${d.startDate} to ${d.endDate}`,
    `Group size: ${d.groupSize}`,
    `Budget: ${d.budget}`,
    `Interests: ${d.interests || "—"}`,
    `Special requests: ${d.specialRequests || "—"}`,
    "Payment status: pending",
  ].join("\n");
  const warnings: string[] = [];
  let requestId: string | null = null;
  let savedToCms = false;

  try {
    const supabase = await createSupabaseAdminClient();
    if (!supabase) {
      return {
        success: false,
        error: "Request storage is not configured. Please try again in a minute.",
      } satisfies SubmitItineraryRequestResult;
    } else {
      const { data: inserted, error } = await supabase
        .from("contact_messages")
        .insert({
          name: d.name,
          email: d.email,
          subject: `Personalized itinerary request — ${d.destination} (awaiting payment)`,
          message: summary,
          consent: true,
        })
        .select("id")
        .single();
      if (error) {
        return {
          success: false,
          error: "We could not save your request. Please try again.",
          warnings: [`cms-save-failed:${error.message}`],
        } satisfies SubmitItineraryRequestResult;
      } else {
        savedToCms = true;
        requestId = inserted?.id ?? null;
      }
    }

    // Confirm receipt to the client.
    try {
      await sendItineraryRequestConfirmationEmail({
        to: d.email,
        name: d.name,
        destination: d.destination,
        deliveryEstimate: CUSTOM_ITINERARY_DELIVERY_ESTIMATE,
      });
    } catch (clientMailErr) {
      warnings.push(`client-confirm-failed:${(clientMailErr as Error).message ?? "unknown"}`);
    }

    // Notify admin so they can review and send a payment link manually.
    try {
      await sendAdminNotificationEmail({
        subject: `New custom itinerary request — ${d.destination}`,
        body: [
          `From: ${d.name} <${d.email}>`,
          "",
          summary,
          "",
          requestId
            ? `View in admin: /admin/messages`
            : "(request saved to contact_messages)",
        ].join("\n"),
      });
    } catch (notifyErr) {
      warnings.push(`admin-notify-failed:${(notifyErr as Error).message ?? "unknown"}`);
    }
  } catch (error) {
    console.error("personalized-itineraries: failed to persist request", error);
    return {
      success: false,
      error: "We could not save your request. Please try again.",
      warnings: ["cms-save-failed"],
    } satisfies SubmitItineraryRequestResult;
  }

  return {
    success: true,
    savedToCms,
    warnings,
  } satisfies SubmitItineraryRequestResult;
}
