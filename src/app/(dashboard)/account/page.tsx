import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardSideNav } from "@/components/dashboard/side-nav";
import { Map, Heart, Sparkles } from "lucide-react";

export const metadata = { title: "My account — DEXTGO" };

export default async function AccountPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  let orderCount = 0;
  if (supabase) {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "paid");
    orderCount = count ?? 0;
  }

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "Traveller";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
      <DashboardSideNav />

      <div className="space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
            Welcome back
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Ciao, {firstName}.
          </h1>
          <p className="mt-2 text-sm text-foreground/60 max-w-2xl">
            Your private travel desk. Pick up where you left off, replay an audio
            guide, or start planning your next adventure.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Purchased itineraries"
            value={orderCount.toString()}
            icon={Map}
            href="/account/itineraries"
          />
          <StatCard label="Saved trips" value="—" icon={Heart} href="/account/saved" />
          <StatCard
            label="Concierge requests"
            value="—"
            icon={Sparkles}
            href="/personalized-itineraries"
          />
        </section>

        <section className="rounded-2xl bg-white border border-black/[0.06] p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Plan your next trip</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Browse our curated experiences or request a fully personalized itinerary.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/itineraries"
              className="inline-flex items-center rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5"
            >
              Browse itineraries
            </Link>
            <Link
              href="/personalized-itineraries"
              className="inline-flex items-center rounded-full bg-white border border-black/[0.08] text-foreground text-sm font-semibold px-5 py-2.5"
            >
              Request a custom trip
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl bg-white border border-black/[0.06] p-5 hover:border-black/[0.12] transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#F5F5F7] flex items-center justify-center">
          <Icon className="w-4 h-4 text-foreground/70" />
        </div>
        <span className="text-xs font-medium text-foreground/60">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </Link>
  );
}
