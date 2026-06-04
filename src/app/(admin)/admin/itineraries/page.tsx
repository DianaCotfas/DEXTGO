import Link from "next/link";
import { Plus } from "lucide-react";
import { featuredItineraries } from "@/data/itineraries";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { RegeneratePdfButton } from "@/components/admin/regenerate-pdf-button";
import { syncStaticContentAction } from "../actions";
import { deleteItinerary, regenerateItineraryPdfAction } from "./actions";

export const metadata = { title: "Itineraries — Admin DEXTGO" };

interface AdminItinerariesPageProps {
  searchParams: Promise<{ status?: string; recipient_email?: string; message?: string }>;
}

export default async function AdminItinerariesPage({ searchParams }: AdminItinerariesPageProps) {
  const { status, recipient_email, message } = await searchParams;
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
  const { data: dbItineraries } = supabase
    ? await supabase
        .from("itineraries")
        .select(
          "id, slug, title, country_slug, region_slug, price_cents, currency, status, updated_at, pdf_r2_key, pdf_generated_at",
        )
        .order("updated_at", { ascending: false })
    : { data: null };
  const fallbackItineraries = featuredItineraries.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    country_slug: item.countrySlug ?? null,
    region_slug: item.regionSlug ?? null,
    price_cents: Math.max(0, Math.round((item.price ?? 0) * 100)),
    currency: "eur",
    status: "published",
    pdf_r2_key: null,
    pdf_generated_at: null,
    updated_at: "",
    source: "static" as const,
  }));
  const itineraries =
    (dbItineraries ?? []).length > 0
      ? (dbItineraries ?? []).map((item) => ({ ...item, source: "database" as const }))
      : fallbackItineraries;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Itineraries</h1>
          <p className="text-sm text-foreground/60">All published & draft itineraries.</p>
        </div>
        <Link
          href="/admin/itineraries/new"
          className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5"
        >
          <Plus className="w-4 h-4" /> New itinerary
        </Link>
      </header>

      {status && (
        <div
          className={`rounded-xl px-4 py-2 text-sm ${
            status === "pdf-regenerate-failed"
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {status === "deleted"
            ? "Itinerary deleted successfully."
            : status === "created"
              ? "Itinerary created successfully."
              : status === "pdf-regenerated"
                ? "PDF regenerated and saved successfully."
                : status === "pdf-regenerate-failed"
                  ? "PDF regeneration failed."
                  : "Itinerary updated successfully."}
          {readableMessage && (
            <p className="mt-1 text-xs">
              {readableMessage}
            </p>
          )}
        </div>
      )}
      {recipient_email && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <p className="font-semibold">Private delivery mode</p>
          <p className="mt-1 text-xs">
            Open an itinerary with <strong>Edit</strong>, then send payment link to{" "}
            <code>{recipient_email}</code>.
          </p>
        </div>
      )}

      {(dbItineraries ?? []).length === 0 && fallbackItineraries.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Showing itineraries from local static content. Sync them to Supabase to
          manage from CMS.
          <form action={syncStaticContentAction} className="mt-2">
            <button
              type="submit"
              className="rounded-full bg-white border border-amber-300 px-4 py-1.5 text-xs font-semibold text-amber-900"
            >
              Sync now
            </button>
          </form>
        </div>
      )}

      <div className="rounded-2xl bg-white border border-black/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#FAFAFA] text-xs font-semibold uppercase tracking-wider text-foreground/60">
            <tr>
              <th className="text-left px-5 py-3">Title</th>
              <th className="text-left px-5 py-3">Country / region</th>
              <th className="text-left px-5 py-3">Price</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">PDF</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {itineraries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-foreground/50">
                  No itineraries yet. Create your first one to get started.
                </td>
              </tr>
            )}
            {itineraries.map((it) => (
              <tr key={it.id}>
                <td className="px-5 py-3 font-medium">{it.title}</td>
                <td className="px-5 py-3 text-foreground/60">
                  {it.country_slug}
                  {it.region_slug ? ` / ${it.region_slug}` : ""}
                </td>
                <td className="px-5 py-3">{formatPrice(it.price_cents, it.currency)}</td>
                <td className="px-5 py-3">
                  <StatusPill status={it.status} />
                  {it.source === "static" && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                      static
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {it.source === "database" ? (
                    <div className="space-y-1">
                      <PdfStatusPill isSaved={Boolean(it.pdf_r2_key)} />
                      <p className="text-[11px] text-foreground/50">
                        {it.pdf_generated_at
                          ? `Generated ${formatRelativeTimestamp(it.pdf_generated_at)}`
                          : "Not generated yet"}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-foreground/45">N/A</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {it.source === "database" ? (
                    <div className="inline-flex flex-wrap items-center justify-end gap-3">
                      <Link
                        href={`/api/itineraries/${it.slug}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-sky-700 hover:underline"
                      >
                        View PDF
                      </Link>
                      <form action={regenerateItineraryPdfAction}>
                        <input type="hidden" name="itinerary_id" value={it.id} />
                        <RegeneratePdfButton />
                      </form>
                      <Link
                        href={`/admin/itineraries/${it.id}${recipient_email ? `?recipient_email=${encodeURIComponent(recipient_email)}` : ""}`}
                        className="text-xs font-semibold text-foreground hover:underline"
                      >
                        Edit
                      </Link>
                      <form action={deleteItinerary}>
                        <input type="hidden" name="id" value={it.id} />
                        <button
                          type="submit"
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-foreground/50">
                      Sync to edit
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatRelativeTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "just now";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function PdfStatusPill({ isSaved }: { isSaved: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
        isSaved
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {isSaved ? "Saved" : "Not saved"}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-50 text-emerald-700",
    draft: "bg-amber-50 text-amber-700",
    archived: "bg-foreground/[0.05] text-foreground/60",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
        map[status] ?? "bg-foreground/[0.05] text-foreground/60"
      }`}
    >
      {status}
    </span>
  );
}
