import { notFound } from "next/navigation";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { ItineraryForm } from "@/components/admin/itinerary-form";
import { StepEditor } from "@/components/admin/step-editor";
import { isConfigured } from "@/lib/env";
import { isTtsConfigured } from "@/lib/tts";
import type { ItineraryExtras } from "@/types";
import {
  deleteItinerary,
  grantPrivateItineraryAccess,
  sendPrivateItineraryPaymentLink,
} from "../actions";

export const metadata = { title: "Edit itinerary — Admin DEXTGO" };

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
    status?: string;
    recipient_email?: string;
    payment_url?: string;
  }>;
}

export default async function EditItineraryPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { error, message, status, recipient_email, payment_url } = await searchParams;
  const readableMessage = (() => {
    if (!message) return null;
    try {
      return decodeURIComponent(message);
    } catch {
      return message;
    }
  })();
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  if (!supabase) notFound();

  const { data: itinerary } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!itinerary) notFound();

  const { data: steps } = await supabase
    .from("itinerary_steps")
    .select("*")
    .eq("itinerary_id", id)
    .order("position");

  const audioReady = isConfigured("r2") && isTtsConfigured();
  const audioReason = !isTtsConfigured()
    ? "No TTS provider configured. Set OPENAI_API_KEY (cheaper) or ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID."
    : !isConfigured("r2")
      ? "Missing Cloudflare R2 keys (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)."
      : undefined;

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{itinerary.title}</h1>
          <p className="text-sm text-foreground/60">
            Slug: <code>{itinerary.slug}</code>
          </p>
        </div>
        <form action={deleteItinerary}>
          <input type="hidden" name="id" value={itinerary.id} />
          <button
            type="submit"
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Delete
          </button>
        </form>
      </header>

      <ItineraryForm
        initial={{
          ...itinerary,
          extras: (itinerary.extras as ItineraryExtras | null) ?? null,
        }}
      />
      {status && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <p className="font-semibold">
            {status === "created"
              ? "Itinerary created successfully."
              : status === "payment-link-created"
                ? "Payment link created."
              : status === "granted"
                ? "Private itinerary marked completed and delivered."
                : "Itinerary updated successfully."}
          </p>
          {status === "payment-link-created" && payment_url && (
            <p className="mt-2 break-all text-[11px]">
              Payment URL: <a className="underline" href={payment_url}>{payment_url}</a>
            </p>
          )}
          {readableMessage && <p className="mt-1 text-[11px]">{readableMessage}</p>}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <p className="font-semibold">Save failed ({error})</p>
          <p className="mt-1">{readableMessage ?? "Please review the fields and try again."}</p>
        </div>
      )}

      <section className="rounded-2xl bg-white border border-black/[0.06] p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-semibold">Private delivery</h2>
        <p className="text-xs text-foreground/60">
          Payment-first workflow: send payment link, client sees a thank-you page, keep itinerary in Draft while building, then mark it completed (Archived/private) and notify the client.
        </p>
        {recipient_email && (
          <p className="text-xs text-sky-700">
            Request email prefilled from CMS message: <strong>{recipient_email}</strong>
          </p>
        )}
        <form action={sendPrivateItineraryPaymentLink} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="itinerary_id" value={itinerary.id} />
          <label className="block min-w-[260px] flex-1">
            <span className="text-xs font-medium text-foreground/70">Requester email</span>
            <input
              type="email"
              name="recipient_email"
              required
              defaultValue={recipient_email ?? ""}
              placeholder="requester@email.com"
              className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-[#1D1D1F] text-white text-xs font-semibold px-5 py-2.5"
          >
            Send payment link
          </button>
        </form>
        <details className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <summary className="cursor-pointer font-semibold">Manual override (skip payment)</summary>
          <p className="mt-2">
            Use when the itinerary is fully finished and payment is already confirmed
            (Stripe webhook, bank transfer, cash, etc.). This marks the itinerary as completed
            private delivery and sends the confirmation email.
          </p>
          <p className="mt-1">No customer charge is created from this action.</p>
          <form action={grantPrivateItineraryAccess} className="mt-3 flex flex-wrap items-end gap-3">
            <input type="hidden" name="itinerary_id" value={itinerary.id} />
            <label className="block min-w-[260px] flex-1">
              <span className="text-xs font-medium text-foreground/70">Requester email</span>
              <input
                type="email"
                name="recipient_email"
                required
                defaultValue={recipient_email ?? ""}
                placeholder="requester@email.com"
                className="mt-1.5 w-full rounded-xl bg-white border border-black/[0.08] px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15"
              />
            </label>
            <button
              type="submit"
              className="rounded-full border border-amber-400 bg-white text-amber-900 text-xs font-semibold px-5 py-2.5"
            >
              Grant access (offline payment confirmed)
            </button>
          </form>
        </details>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3">Steps</h2>
        <div
          className={`mb-3 rounded-xl border px-3 py-2 text-xs ${
            audioReady
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {audioReady
            ? "Audio guide generation is enabled. Use 'Generate audio' on each saved step."
            : `Audio guide generation is currently disabled. ${audioReason}`}
        </div>
        <StepEditor
          itineraryId={itinerary.id}
          initialSteps={steps ?? []}
          audioReady={audioReady}
          audioReason={audioReason}
        />
      </section>
    </div>
  );
}
