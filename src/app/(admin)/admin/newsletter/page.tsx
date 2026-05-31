import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Newsletter — Admin DEXTGO" };

type Subscriber = {
  email: string;
  created_at: string;
};

export default async function AdminNewsletterPage() {
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  const { data: rows } = supabase
    ? await supabase
        .from("newsletter_subscribers")
        .select("email, created_at")
        .order("created_at", { ascending: false })
    : { data: null };

  const subscribers = (rows ?? []) as Subscriber[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Newsletter</h1>
        <p className="text-sm text-foreground/60">
          Subscribers are stored in Supabase (`newsletter_subscribers`). Welcome emails are sent via Resend from the API route.
        </p>
      </header>

      <section className="rounded-2xl bg-white border border-black/[0.06] p-5">
        <h2 className="text-sm font-semibold">Current setup</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-foreground/75">
          <li>• Subscription form submits to `/api/newsletter`</li>
          <li>• Email saved in Supabase table `newsletter_subscribers`</li>
          <li>• Welcome email sent through Resend (`sendNewsletterWelcome`)</li>
          <li>• Campaign broadcasting is not automated in-app yet (managed externally in Resend or future Phase 3 feature)</li>
        </ul>
      </section>

      <section className="rounded-2xl bg-white border border-black/[0.06] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Subscribers</h2>
          <span className="rounded-full bg-black/[0.05] px-3 py-1 text-xs font-semibold">
            {subscribers.length}
          </span>
        </div>

        {subscribers.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">No subscribers yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] text-left text-foreground/55">
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 font-medium">Subscribed at (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={`${subscriber.email}-${subscriber.created_at}`} className="border-b border-black/[0.04]">
                    <td className="py-2 pr-4">{subscriber.email}</td>
                    <td className="py-2 text-foreground/65">{subscriber.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
