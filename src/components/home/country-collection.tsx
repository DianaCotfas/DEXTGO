import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { countries } from "@/data/countries";
import { SectionHeading } from "@/components/shared/section-heading";
import { HorizontalSlider } from "@/components/shared/horizontal-slider";
import type { MarketingCountryCard } from "@/lib/marketing-content";

export function CountryCollection({
  items = countries,
}: {
  items?: MarketingCountryCard[];
}) {
  return (
    <section className="section-padding section-gap bg-white">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading title="The Collection" />

        <div className="mt-6">
          <HorizontalSlider
            ariaLabel="Countries collection"
            gapPx={10}
          >
            {items.map((country) => (
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
  );
}
