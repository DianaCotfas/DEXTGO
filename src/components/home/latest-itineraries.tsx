import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { featuredItineraries } from "@/data/itineraries";
import { SectionHeading } from "@/components/shared/section-heading";
import { HorizontalSlider } from "@/components/shared/horizontal-slider";
import { SaveTripButton } from "@/components/itinerary/save-trip-button";
import {
  type MarketingItineraryCard,
} from "@/lib/marketing-content";

export function LatestItineraries({
  items = featuredItineraries,
}: {
  items?: MarketingItineraryCard[];
}) {
  return (
    <section className="section-padding section-gap bg-white">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading title="Latest Itineraries" />

        <div className="mt-6">
          <HorizontalSlider ariaLabel="Latest itineraries" gapPx={10}>
            {items.map((itinerary) => (
              <div
                key={itinerary.id}
                className="snap-start shrink-0 w-[70%] sm:w-[42%] md:w-[34%] lg:w-[260px]"
              >
                <Link
                  href={`/itineraries/${itinerary.slug}`}
                  className="group block rounded-2xl bg-white card-shadow card-shine hover:card-shadow-hover transition-shadow duration-500 overflow-hidden"
                >
                  <div className="relative aspect-[306/396] overflow-hidden">
                    {/* Signed /api/media URLs include dynamic query params; use native img to avoid Next image optimizer restrictions. */}
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
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/itineraries"
            className="group inline-flex items-center gap-2 px-8 py-3.5 bg-[#1D1D1F] text-white text-sm font-semibold rounded-full hover:bg-[#1D1D1F]/90 transition-all duration-500 hover:gap-3 hover:shadow-[0_8px_32px_rgba(29,29,31,0.3)]"
          >
            View All Itineraries
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
