import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { DashboardSideNav } from "@/components/dashboard/side-nav";
import { formatPrice } from "@/lib/format";
import { featuredItineraries } from "@/data/itineraries";
import { resolveR2Url } from "@/lib/r2";

export const metadata = { title: "My itineraries — DEXTGO" };

export default async function MyItinerariesPage() {
  const user = await requireUser();
  // Use admin client so RLS doesn't hide the user's own paid orders
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());

  type OrderRow = {
    id: string;
    amount_cents: number;
    currency: string;
    created_at: string;
    itinerary_slug: string | null;
    itineraries: {
      id: string;
      slug: string;
      title: string;
      excerpt: string | null;
      hero_image_url: string | null;
      duration: string | null;
      status: "draft" | "published" | "archived";
    } | null;
  };

  let orders: OrderRow[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("orders")
      .select(
        "id, amount_cents, currency, created_at, itinerary_slug, itineraries(id, slug, title, excerpt, hero_image_url, duration, status)",
      )
      .eq("user_id", user.id)
      .eq("status", "paid")
      .order("created_at", { ascending: false });
    orders = (data ?? []) as unknown as OrderRow[];
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
      <DashboardSideNav />
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">My itineraries</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Tap any trip to open the interactive map, color-coded steps and audio guides.
          </p>
        </header>

        {orders.length === 0 ? (
          <div className="rounded-2xl bg-white border border-black/[0.06] p-8 text-center">
            <p className="text-sm text-foreground/60">
              You haven&apos;t purchased an itinerary yet.
            </p>
            <Link
              href="/itineraries"
              className="mt-4 inline-flex items-center rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5"
            >
              Browse itineraries
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orders.map((order) => {
              // Never show work-in-progress custom drafts in client dashboard.
              // They become visible only when Diana marks them completed (archived private delivery)
              // or published (public itineraries).
              if (order.itineraries?.status === "draft") return null;

              const fallback = featuredItineraries.find(
                (item) => item.slug === order.itinerary_slug,
              );
              if (!order.itineraries && !fallback) return null;
              const it = order.itineraries
                ? {
                    slug: order.itineraries.slug,
                    title: order.itineraries.title,
                    excerpt: order.itineraries.excerpt,
                    hero_image_url: order.itineraries.hero_image_url,
                    duration: order.itineraries.duration,
                  }
                : fallback
                  ? {
                      slug: fallback.slug,
                      title: fallback.title,
                      excerpt: fallback.excerpt,
                      hero_image_url: fallback.image,
                      duration: fallback.duration,
                    }
                  : order.itinerary_slug
                    ? {
                        // Itinerary join failed but we have the slug — show a minimal entry
                        slug: order.itinerary_slug,
                        title: order.itinerary_slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                        excerpt: null,
                        hero_image_url: null,
                        duration: null,
                      }
                    : null;
              if (!it) return null;
              const heroImage = it.hero_image_url ? resolveR2Url(it.hero_image_url) : null;
              return (
                <li
                  key={order.id}
                  className="rounded-2xl bg-white border border-black/[0.06] overflow-hidden"
                >
                  <Link href={`/itineraries/${it.slug}`} className="block group">
                    <div className="relative aspect-[16/9] bg-[#F5F5F7]">
                      {heroImage && (
                        <img
                          src={heroImage}
                          alt={it.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      )}
                    </div>
                    <div className="p-5">
                      <h2 className="text-base font-semibold">{it.title}</h2>
                      {it.duration && (
                        <p className="mt-1 text-xs text-foreground/50">{it.duration}</p>
                      )}
                      <p className="mt-3 text-xs text-foreground/40">
                        Purchased {new Date(order.created_at).toLocaleDateString()} {"\u2014"}{" "}
                        {formatPrice(order.amount_cents, order.currency)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
