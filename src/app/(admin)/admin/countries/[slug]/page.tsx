import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CountryForm } from "@/components/admin/country-form";
import { RegionsManager } from "@/components/admin/regions-manager";

export const metadata = { title: "Edit country — Admin DEXTGO" };

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}

export default async function EditCountryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { saved } = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!supabase) notFound();

  const { data: country } = await supabase
    .from("countries")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!country) notFound();

  const { data: regions } = await supabase
    .from("regions")
    .select("*")
    .eq("country_slug", slug)
    .order("position");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{country.name}</h1>
          <p className="text-sm text-foreground/55 mt-1">/{country.slug}</p>
        </div>
        <Link
          href={`/itineraries/countries/${country.slug}`}
          className="text-xs font-semibold text-foreground/70 hover:text-foreground hover:underline"
          prefetch={false}
        >
          View public page
        </Link>
      </div>
      {saved === "1" && (
        <p className="rounded-xl bg-emerald-50 text-emerald-800 text-sm px-4 py-3 border border-emerald-100">
          Country saved successfully.
        </p>
      )}
      <CountryForm initial={country} />
      <section>
        <h2 className="text-base font-semibold mb-3">Regions</h2>
        <RegionsManager countrySlug={country.slug} initialRegions={regions ?? []} />
      </section>
    </div>
  );
}
