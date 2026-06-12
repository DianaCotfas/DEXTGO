import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { countries } from "@/data/countries";
import {
  loadCountryDetail,
  loadPublishedItineraryCardsByCountry,
  type MarketingItineraryCard,
} from "@/lib/marketing-content";
import { SaveTripButton } from "@/components/itinerary/save-trip-button";

export const revalidate = 300;
export const dynamicParams = true;

interface Params {
  params: Promise<{ country: string }>;
}

export async function generateStaticParams() {
  return countries.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { country: slug } = await params;
  const country = await loadCountryDetail(slug);
  if (!country) return { title: "Country not found" };
  return {
    title: `${country.name} Itineraries`,
    description: country.tagline,
  };
}

export default async function CountryPage({ params }: Params) {
  const { country: slug } = await params;
  const country = await loadCountryDetail(slug);
  if (!country) notFound();

  const itineraries = await loadPublishedItineraryCardsByCountry(country.slug);
  const regions = country.regions ?? [];

  return (
    <>
      <PageHero
        title={country.name}
        subtitle={country.tagline}
        backgroundImage={country.image}
      />

      {regions.length > 0 && (
        <section className="section-padding section-gap bg-white">
          <div className="mx-auto max-w-[1400px]">
            <SectionHeading
              eyebrow="Explore the regions"
              title={`Regions of ${country.name}`}
            />

            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {regions.map((region) => (
                <Link
                  key={region.slug}
                  href={`/itineraries/countries/${country.slug}/${region.slug}`}
                  className="group block relative aspect-[4/3] rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow duration-500"
                >
                  <Image
                    src={region.image || country.image}
                    alt={region.name}
                    fill
                    className="object-cover transition-all duration-[800ms] ease-out group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="text-xl font-semibold text-white mb-1.5 transition-transform duration-500 group-hover:-translate-y-1">
                      {region.name}
                    </h3>
                    <p className="text-sm text-white/75 leading-relaxed line-clamp-2">
                      {region.tagline}
                    </p>
                    <div className="flex items-center gap-1.5 mt-3 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                      <span className="text-xs font-semibold text-white/90">
                        Explore region
                      </span>
                      <ArrowRight className="w-3 h-3 text-white/90" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {itineraries.length > 0 && (
        <section className="section-padding section-gap bg-[#FAFAFA]">
          <div className="mx-auto max-w-[1400px]">
            <SectionHeading
              eyebrow="Ready-made experiences"
              title={`Itineraries in ${country.name}`}
            />

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
          </div>
        </section>
      )}

      <section className="section-padding section-gap">
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeading
            title={`Want a custom ${country.name} trip?`}
            subtitle="Tell us about your dream experience and we'll craft a bespoke itinerary tailored just for you."
          />
          <div className="mt-8">
            <Link
              href="/personalized-itineraries"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-[#1D1D1F] text-white text-sm font-semibold rounded-full hover:bg-[#1D1D1F]/90 transition-all duration-300 hover:scale-[1.02]"
            >
              Request a Custom Itinerary
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
