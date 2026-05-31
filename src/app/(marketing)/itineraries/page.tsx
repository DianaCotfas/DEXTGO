import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { HorizontalSlider } from "@/components/shared/horizontal-slider";
import { SaveTripButton } from "@/components/itinerary/save-trip-button";
import { ITINERARY_INTERESTS } from "@/lib/itinerary-interest-filters";
import {
  loadCountryCards,
  loadHeroMediaByPageSlug,
  loadPublishedItineraryCards,
  type MarketingItineraryCard,
} from "@/lib/marketing-content";

// Re-fetch every 5 minutes so newly published itineraries appear without a full redeploy
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Itineraries",
  description:
    "Browse DEXTGO's collection of expertly curated travel itineraries with interactive maps, audio guides, and insider tips.",
};

interface ItinerariesPageProps {
  searchParams: Promise<{ interest?: string }>;
}

function matchesInterest(
  itinerary: MarketingItineraryCard,
  interestSlug: string,
) {
  const rule = ITINERARY_INTERESTS.find((i) => i.slug === interestSlug);
  if (!rule) return false;
  // STRICT: match only against the explicit category field (set via admin dropdown)
  const category = (itinerary.category ?? "").trim().toLowerCase();
  if (!category) return false;
  // The dropdown stores the rule.title (e.g. "Family Trips"); also accept rule.label or rule.slug
  return (
    category === rule.title.toLowerCase() ||
    category === rule.label.toLowerCase() ||
    category === rule.slug.toLowerCase()
  );
}

export default async function ItinerariesPage({ searchParams }: ItinerariesPageProps) {
  const { interest } = await searchParams;
  const [heroMedia, itineraries, countries] = await Promise.all([
    loadHeroMediaByPageSlug("itineraries"),
    loadPublishedItineraryCards(),
    loadCountryCards(),
  ]);
  const activeInterest = ITINERARY_INTERESTS.find((i) => i.slug === interest);
  const filteredItineraries = activeInterest
    ? itineraries.filter((itinerary) => matchesInterest(itinerary, activeInterest.slug))
    : itineraries;
  // Don't fall back to all itineraries when nothing matches — show an empty state instead
  const visibleItineraries = filteredItineraries;

  return (
    <>
      <PageHero
        title="Our Itineraries"
        subtitle="Expertly curated travel experiences — each one personally tested and verified by our team."
        backgroundImage={heroMedia.image}
        backgroundVideo={heroMedia.video}
        backgroundVideoHls={heroMedia.videoHls}
        backgroundVideoPoster={heroMedia.videoPoster ?? heroMedia.image}
      />

      <section className="section-padding section-gap">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading title="Latest Itineraries" />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/itineraries"
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                !activeInterest
                  ? "bg-[#1D1D1F] text-white"
                  : "bg-black/[0.05] text-foreground/75 hover:bg-black/[0.08]"
              }`}
            >
              All
            </Link>
            {ITINERARY_INTERESTS.map((item) => (
              <Link
                key={item.slug}
                href={`/itineraries?interest=${item.slug}`}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  activeInterest?.slug === item.slug
                    ? "bg-[#1D1D1F] text-white"
                    : "bg-black/[0.05] text-foreground/75 hover:bg-black/[0.08]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-6">
            <HorizontalSlider ariaLabel="Latest itineraries" gapPx={10}>
              {visibleItineraries.map((itinerary) => (
                <div
                  key={itinerary.id}
                  className="snap-start shrink-0 w-[70%] sm:w-[42%] md:w-[34%] lg:w-[260px]"
                >
                  <Link
                    href={`/itineraries/${itinerary.slug}`}
                    className="group block rounded-2xl bg-white card-shadow card-shine hover:card-shadow-hover transition-shadow duration-500 overflow-hidden"
                  >
                    <div className="relative aspect-[306/396] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={itinerary.image}
                        alt={itinerary.title}
                        className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-[800ms] ease-out group-hover:scale-110"
                        style={{ minWidth: "100%", minHeight: "100%" }}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/5" />

                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-[#1D1D1F] shadow-sm">
                          €{itinerary.price}
                        </span>
                      </div>
                      {itinerary.category && (
                        <div className="absolute top-16 left-4 right-16 z-10 pointer-events-none">
                          <span className="inline-flex items-center max-w-full truncate px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold text-[#1D1D1F]">
                            {itinerary.category}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 z-20">
                        <SaveTripButton itinerarySlug={itinerary.slug} />
                      </div>

                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-lg font-semibold text-white line-clamp-2 min-h-[3.2rem] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                          {itinerary.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-3 text-xs text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {itinerary.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {itinerary.duration}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 min-h-[132px] flex flex-col">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.8rem]">
                        {itinerary.excerpt}
                      </p>
                      <div className="flex items-center gap-1.5 mt-auto pt-4 text-xs font-semibold text-foreground opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                        View Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </HorizontalSlider>
            {activeInterest && filteredItineraries.length === 0 && (
              <p className="mt-5 text-sm text-foreground/60">
                No itineraries in the <strong>{activeInterest.label}</strong> category yet. Check back soon.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section-padding section-gap bg-[#F5F5F7]">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading title="The Collection" />

          <div className="mt-6">
            <HorizontalSlider ariaLabel="Countries collection" gapPx={10}>
              {countries.map((country) => (
                <div
                  key={country.slug}
                  className="snap-start shrink-0 w-[82%] sm:w-[48%] md:w-[39%] lg:w-[306px]"
                >
                  <Link
                    href={`/itineraries/countries/${country.slug}`}
                    className="group block relative aspect-[306/495] rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow duration-500"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={country.image}
                      alt={country.name}
                      className="absolute inset-0 h-full w-full object-cover transition-all duration-[800ms] ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />

                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 transition-transform duration-500 group-hover:-translate-y-1">
                        {country.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/70 leading-relaxed line-clamp-2 transition-all duration-500 group-hover:text-white/90">
                        {country.tagline}
                      </p>
                      <div className="flex items-center gap-1.5 mt-3 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                        <span className="text-xs font-semibold text-white/90">
                          Explore
                        </span>
                        <ArrowRight className="w-3 h-3 text-white/90" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </HorizontalSlider>
          </div>
        </div>
      </section>

      <section className="section-padding section-gap">
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeading
            title="Want Something Unique?"
            subtitle="Can't find exactly what you're looking for? Tell us about your dream trip and we'll craft a bespoke itinerary just for you."
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
