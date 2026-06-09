import Link from "next/link";
import { Map, Newspaper, ShoppingBag, Users } from "lucide-react";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { grantAdminByEmailAction, syncStaticContentAction } from "./actions";

export const metadata = { title: "Admin overview — DEXTGO" };

async function counts() {
  const adminClient = await createSupabaseAdminClient();
  const supabase = adminClient ?? (await createSupabaseServerClient());
  if (!supabase) {
    return {
      itineraries: 0,
      blog: 0,
      orders: 0,
      users: 0,
      configured: false,
      adminWriteConfigured: false,
      admins: [] as { email: string; full_name: string | null }[],
    };
  }
  const [itineraries, blog, orders, users, admins] = await Promise.all([
    supabase.from("itineraries").select("id", { count: "exact", head: true }),
    supabase.from("blog_posts").select("slug", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("email, full_name")
      .eq("is_admin", true)
      .order("email"),
  ]);
  return {
    itineraries: itineraries.count ?? 0,
    blog: blog.count ?? 0,
    orders: orders.count ?? 0,
    users: users.count ?? 0,
    configured: true,
    adminWriteConfigured: !!adminClient,
    admins: admins.data ?? [],
  };
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string; email?: string }>;
}) {
  const c = await counts();
  const params = await searchParams;
  const email = params.email ? decodeURIComponent(params.email) : "";

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
      {params.notice === "admin-added" && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-sm text-emerald-900">
          Admin access granted to <strong>{email}</strong>.
        </div>
      )}
      {params.notice === "admin-already-exists" && (
        <div className="rounded-2xl bg-sky-50 border border-sky-200 p-5 text-sm text-sky-900">
          <strong>{email}</strong> is already an admin.
        </div>
      )}
      {params.error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 text-sm text-rose-900">
          {params.error === "missing-service-role" ? (
            <>
              Admin write tools are disabled because{" "}
              <code>SUPABASE_SERVICE_ROLE_KEY</code> is missing on Vercel.
            </>
          ) : params.error === "admin-user-not-found" ? (
            <>
              Could not find a profile for <strong>{email}</strong>. Ask the user to
              sign in once first, then grant admin access.
            </>
          ) : (
            <>Could not update admin access ({params.error}).</>
          )}
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

      <section className="rounded-2xl bg-white border border-black/[0.06] p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Admin access</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Grant CMS admin rights to an existing user account.
          </p>
        </div>
        {!c.adminWriteConfigured && (
          <p className="text-sm text-amber-700">
            Add <code>SUPABASE_SERVICE_ROLE_KEY</code> on Vercel to enable this.
          </p>
        )}
        <form action={grantAdminByEmailAction} className="flex flex-wrap gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder="new-admin@example.com"
            className="min-w-[260px] flex-1 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!c.adminWriteConfigured}
            className="rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-50"
          >
            Add admin
          </button>
        </form>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/55">
            Current admins
          </p>
          {c.admins.length === 0 ? (
            <p className="mt-2 text-sm text-foreground/60">No admins found.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {c.admins.map((admin) => (
                <li key={admin.email} className="text-sm text-foreground/80">
                  {admin.full_name ? `${admin.full_name} — ` : ""}
                  {admin.email}
                </li>
              ))}
            </ul>
          )}
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
