import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { HorizontalSlider } from "@/components/shared/horizontal-slider";
import { ITINERARY_INTERESTS } from "@/lib/itinerary-interest-filters";
import { featuredItineraries } from "@/data/itineraries";
import type { MarketingItineraryCard } from "@/lib/marketing-content";

function matchesInterest(itinerary: MarketingItineraryCard, interestSlug: string) {
  const rule = ITINERARY_INTERESTS.find((i) => i.slug === interestSlug);
  if (!rule) return false;
  const category = (itinerary.category ?? "").trim().toLowerCase();
  if (!category) return false;
  return (
    category === rule.title.toLowerCase() ||
    category === rule.label.toLowerCase() ||
    category === rule.slug.toLowerCase()
  );
}

export function ExploreByInterest({
  itineraries = featuredItineraries,
}: {
  itineraries?: MarketingItineraryCard[];
}) {
  return (
    <section className="section-padding section-gap bg-white">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading title="Explore by Interest" />

        <div className="mt-6">
          <HorizontalSlider ariaLabel="Explore by interest" gapPx={10}>
            {ITINERARY_INTERESTS.map((item) => {
              const match = itineraries.find((itinerary) =>
                matchesInterest(itinerary, item.slug),
              );
              return (
              <div
                key={item.slug}
                className="snap-start shrink-0 w-[82%] sm:w-[48%] md:w-[39%] lg:w-[306px]"
              >
                <Link
                  href={`/itineraries?interest=${item.slug}`}
                  className="group block relative aspect-[306/495] rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-shadow duration-500"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image || match?.image}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover transition-all duration-[800ms] ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />

                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <span className="inline-flex items-center max-w-full truncate px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold text-[#1D1D1F]">
                      {item.label}
                    </span>
                    <h3 className="mt-2 text-lg sm:text-xl font-semibold text-white transition-transform duration-500 group-hover:-translate-y-1">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-white/70 leading-relaxed line-clamp-2 transition-all duration-500 group-hover:text-white/90">
                      {item.description}
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
            )})}
          </HorizontalSlider>
        </div>
      </div>
    </section>
  );
}
