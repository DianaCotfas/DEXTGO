import { requireAdmin } from "@/lib/auth";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Messages — Admin DEXTGO" };

export default async function AdminMessagesPage() {
  await requireAdmin();
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  const { data: messages } = supabase
    ? await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: null };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Contact messages</h1>
        <p className="text-sm text-foreground/60">
          Submissions from contact and personalized itinerary forms. Email notification is attempted to{" "}
          <code>info@dextgo.com</code> and configured recipients.
        </p>
      </header>
      <ul className="space-y-3">
        {(messages ?? []).length === 0 && (
          <li className="rounded-2xl bg-white border border-black/[0.06] p-8 text-center text-foreground/50">
            No messages yet.
          </li>
        )}
        {(messages ?? []).map((m) => (
          <li key={m.id} className="rounded-2xl bg-white border border-black/[0.06] p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">
                {m.name}{" "}
                <span className="text-xs text-foreground/50 font-normal">
                  &lt;{m.email}&gt;
                </span>
              </p>
              <p className="text-xs text-foreground/50">
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
            {m.subject && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                {m.subject}
                {m.subject.toLowerCase().includes("personalized itinerary request") && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 normal-case tracking-normal">
                    private-request
                  </span>
                )}
              </p>
            )}
            <p className="mt-2 text-sm whitespace-pre-wrap">{m.message}</p>
            {m.subject?.toLowerCase().includes("personalized itinerary request") && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/itineraries?recipient_email=${encodeURIComponent(m.email)}`}
                  className="inline-flex rounded-full border border-black/[0.08] px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-black/[0.03]"
                >
                  Open payment + delivery flow
                </Link>
                <span className="text-[11px] text-foreground/55">
                  Select itinerary, send payment link, and unlock only after payment.
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
