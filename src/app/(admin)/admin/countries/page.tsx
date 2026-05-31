import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";

export const metadata = { title: "Countries & regions — Admin DEXTGO" };

interface CountryRow {
  slug: string;
  name: string;
  tagline: string | null;
  regions: { slug: string; name: string }[] | null;
}

export default async function AdminCountriesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: countries } = supabase
    ? await supabase
        .from("countries")
        .select("*, regions(slug, name)")
        .order("position")
        .returns<CountryRow[]>()
    : { data: null as CountryRow[] | null };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Countries & regions</h1>
          <p className="text-sm text-foreground/60">Edit covers, taglines and ordering.</p>
        </div>
        <Link
          href="/admin/countries/new"
          className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] text-white text-sm font-semibold px-5 py-2.5"
        >
          <Plus className="w-4 h-4" /> New country
        </Link>
      </header>
      <ul className="grid sm:grid-cols-2 gap-4">
        {(countries ?? []).map((c) => (
          <li
            key={c.slug}
            className="rounded-2xl bg-white border border-black/[0.06] p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold">{c.name}</h2>
                <p className="text-xs text-foreground/50">/{c.slug}</p>
              </div>
              <Link
                href={`/admin/countries/${c.slug}`}
                className="text-xs font-semibold text-foreground hover:underline"
              >
                Edit
              </Link>
            </div>
            <p className="mt-2 text-sm text-foreground/60">{c.tagline}</p>
            <p className="mt-3 text-[11px] uppercase tracking-wider text-foreground/40">
              {c.regions?.length ?? 0} regions
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
