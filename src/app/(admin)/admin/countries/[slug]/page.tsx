import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CountryForm } from "@/components/admin/country-form";
import { RegionsManager } from "@/components/admin/regions-manager";

export const metadata = { title: "Edit country — Admin DEXTGO" };

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditCountryPage({ params }: PageProps) {
  const { slug } = await params;
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
      <h1 className="text-2xl font-semibold tracking-tight">{country.name}</h1>
      <CountryForm initial={country} />
      <section>
        <h2 className="text-base font-semibold mb-3">Regions</h2>
        <RegionsManager countrySlug={country.slug} initialRegions={regions ?? []} />
      </section>
    </div>
  );
}
