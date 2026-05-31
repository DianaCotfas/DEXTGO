import { featuredItineraries } from "@/data/itineraries";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Orders — Admin DEXTGO" };

interface OrderRow {
  id: string;
  email: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  itinerary_slug: string | null;
  itineraries: { title: string } | null;
}

export default async function AdminOrdersPage() {
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  const { data: orders } = supabase
    ? await supabase
        .from("orders")
        .select(
          "id, email, amount_cents, currency, status, created_at, itinerary_slug, itineraries(title)",
        )
        .order("created_at", { ascending: false })
        .limit(200)
        .returns<OrderRow[]>()
    : { data: null as OrderRow[] | null };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-foreground/60">Last 200 orders, newest first.</p>
      </header>
      <div className="rounded-2xl bg-white border border-black/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#FAFAFA] text-xs font-semibold uppercase tracking-wider text-foreground/60">
            <tr>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3">Customer</th>
              <th className="text-left px-5 py-3">Itinerary</th>
              <th className="text-left px-5 py-3">Amount</th>
              <th className="text-left px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-foreground/50">
                  No orders yet.
                </td>
              </tr>
            )}
            {(orders ?? []).map((o) => (
              <tr key={o.id}>
                <td className="px-5 py-3 whitespace-nowrap text-foreground/60">
                  {new Date(o.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-3">{o.email}</td>
                <td className="px-5 py-3">
                  {o.itineraries?.title ??
                    featuredItineraries.find((item) => item.slug === o.itinerary_slug)
                      ?.title ??
                    "—"}
                </td>
                <td className="px-5 py-3">
                  {formatPrice(o.amount_cents, o.currency)}
                </td>
                <td className="px-5 py-3">{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
