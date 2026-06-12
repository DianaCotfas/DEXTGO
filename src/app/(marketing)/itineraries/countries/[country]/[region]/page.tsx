import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { countries } from "@/data/countries";
import {
  loadPublishedItineraryCardsByRegion,
  loadRegionDetail,
  type MarketingItineraryCard,
} from "@/lib/marketing-content";
import { SaveTripButton } from "@/components/itinerary/save-trip-button";

export const revalidate = 300;
export const dynamicParams = true;

interface Params {
  params: Promise<{ country: string; region: string }>;
}

export async function generateStaticParams() {
  const params: { country: string; region: string }[] = [];
  for (const c of countries) {
    for (const r of c.regions ?? []) {
      params.push({ country: c.slug, region: r.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { country: countrySlug, region: regionSlug } = await params;
  const { country, region } = await loadRegionDetail(countrySlug, regionSlug);
  if (!country || !region) return { title: "Region not found" };
  return {
    title: `${region.name}, ${country.name} Itineraries`,
    description: region.tagline,
  };
}

export default async function RegionPage({ params }: Params) {
  const { country: countrySlug, region: regionSlug } = await params;
  const { country, region } = await loadRegionDetail(countrySlug, regionSlug);
  if (!country || !region) notFound();

  const itineraries = await loadPublishedItineraryCardsByRegion(country.slug, region.slug);

  return (
    <>
      <PageHero
        title={region.name}
        subtitle={region.tagline}
        backgroundImage={region.image || country.image}
      />

      <section className="section-padding pt-6">
        <div className="mx-auto max-w-[1400px] text-sm text-muted-foreground">
          <Link
            href="/itineraries"
            className="hover:text-foreground transition-colors"
          >
            Itineraries
          </Link>
          <span className="mx-2 text-muted-foreground/50">/</span>
          <Link
            href={`/itineraries/countries/${country.slug}`}
            className="hover:text-foreground transition-colors"
          >
            {country.name}
          </Link>
          <span className="mx-2 text-muted-foreground/50">/</span>
          <span className="text-foreground">{region.name}</span>
        </div>
      </section>

      {(region.description || region.highlights?.length) && (
        <section className="section-padding pt-10 sm:pt-14 bg-white">
          <div className="mx-auto max-w-[1100px] grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
            {region.description && (
              <div className="lg:col-span-3 text-[15px] sm:text-base leading-relaxed text-foreground/80">
                <p>{region.description}</p>
              </div>
            )}
            {region.highlights?.length ? (
              <ul className="lg:col-span-2 space-y-3 text-sm text-foreground/75">
                {region.highlights.map((h) => (
                  <li key={h} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground/30 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      )}

      {region.gallery?.length ? (
        <section className="section-padding pt-10 sm:pt-14 bg-white">
          <div className="mx-auto max-w-[1400px] grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {region.gallery.map((src, i) => (
              <div
                key={src}
                className="relative aspect-square overflow-hidden rounded-2xl bg-black/5"
              >
                <Image
                  src={src}
                  alt={`${region.name} — ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-padding section-gap bg-white">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading
            eyebrow={country.name}
            title={`Itineraries in ${region.name}`}
          />

          {itineraries.length === 0 ? (
            <div className="mt-14 text-center">
              <p className="text-base text-muted-foreground max-w-md mx-auto">
                We&apos;re crafting new itineraries for {region.name}{" "}right now.
                In the meantime, tell us what you&apos;d love to experience and
                we&apos;ll build something personal for you.
              </p>
              <Link
                href={`/personalized-itineraries?region=${region.slug}`}
                className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-[#1D1D1F] text-white text-sm font-semibold rounded-full hover:bg-[#1D1D1F]/90 transition-all duration-300 hover:scale-[1.02]"
              >
                Request a Custom Itinerary
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {(itineraries as MarketingItineraryCard[]).map((itinerary) => (
                <Link
                  key={itinerary.id}
                  href={`/itineraries/${itinerary.slug}`}
                  className="group block rounded-2xl overflow-hidden bg-white card-shadow hover:card-shadow-hover transition-shadow duration-500"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={itinerary.image}
                      alt={itinerary.title}
                      className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-[#1D1D1F]">
                        €{itinerary.price}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 z-20">
                      <SaveTripButton itinerarySlug={itinerary.slug} />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="text-lg font-semibold text-white line-clamp-2 min-h-[3.2rem] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                        {itinerary.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6 min-h-[132px] flex flex-col">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 min-h-[1rem]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {itinerary.country}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {itinerary.duration}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.8rem]">
                      {itinerary.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
