import Link from "next/link";
import { Map, Newspaper, ShoppingBag, Users } from "lucide-react";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { syncStaticContentAction } from "./actions";

export const metadata = { title: "Admin overview — DEXTGO" };

async function counts() {
  const supabase =
    (await createSupabaseAdminClient()) ?? (await createSupabaseServerClient());
  if (!supabase) {
    return { itineraries: 0, blog: 0, orders: 0, users: 0, configured: false };
  }
  const [itineraries, blog, orders, users] = await Promise.all([
    supabase.from("itineraries").select("id", { count: "exact", head: true }),
    supabase.from("blog_posts").select("slug", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  return {
    itineraries: itineraries.count ?? 0,
    blog: blog.count ?? 0,
    orders: orders.count ?? 0,
    users: users.count ?? 0,
    configured: true,
  };
}

export default async function AdminHome() {
  const c = await counts();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to the CMS</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Everything that ships on dextgo.com is editable from here.
        </p>
      </header>

      {!c.configured && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-900">
          Supabase is not connected yet. The CMS will populate the moment the keys
          land in <code>.env.local</code>.
        </div>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Itineraries" value={c.itineraries} href="/admin/itineraries" icon={Map} />
        <Stat label="Blog posts" value={c.blog} href="/admin/blog" icon={Newspaper} />
        <Stat label="Paid orders" value={c.orders} href="/admin/orders" icon={ShoppingBag} />
        <Stat label="Customers" value={c.users} href="/admin/orders" icon={Users} />
      </section>

      <section className="rounded-2xl bg-white border border-black/[0.06] p-6">
        <h2 className="text-base font-semibold">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/itineraries/new"
            className="rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5"
          >
            New itinerary
          </Link>
          <Link
            href="/admin/blog/new"
            className="rounded-full bg-white border border-black/[0.08] text-foreground text-sm font-semibold px-5 py-2.5"
          >
            New blog post
          </Link>
          <form action={syncStaticContentAction}>
            <button
              type="submit"
              className="rounded-full bg-white border border-black/[0.08] text-foreground text-sm font-semibold px-5 py-2.5"
            >
              Sync static content
            </button>
          </form>
          <Link
            href="/admin/gallery"
            className="rounded-full bg-white border border-black/[0.08] text-foreground text-sm font-semibold px-5 py-2.5"
          >
            Update gallery
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: number;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl bg-white border border-black/[0.06] p-5 hover:border-black/[0.12] transition-colors"
    >
      <div className="flex items-center gap-2.5 text-foreground/60">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </Link>
  );
}
