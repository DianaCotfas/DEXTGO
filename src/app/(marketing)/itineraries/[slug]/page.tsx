import { notFound } from "next/navigation";
import Link from "next/link";
import { featuredItineraries } from "@/data/itineraries";
import { loadItineraryBySlug } from "@/lib/itineraries/loader";
import { PublicTeaser } from "@/components/itinerary/public-teaser";
import { UnlockedItinerary } from "@/components/itinerary/unlocked-itinerary";
import { BuyButton } from "@/components/itinerary/buy-button";
import { HeroCarousel } from "@/components/itinerary/hero-carousel";
import { DownloadPdfButton } from "@/components/itinerary/download-pdf-button";
import { SaveTripButton } from "@/components/itinerary/save-trip-button";
import { hasPurchased } from "@/lib/purchases";
import { formatPrice } from "@/lib/format";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return featuredItineraries.map((it) => ({ slug: it.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const itinerary = featuredItineraries.find((i) => i.slug === slug);
  if (!itinerary) return {};
  return {
    title: `${itinerary.title} — DEXTGO`,
    description: itinerary.excerpt,
    openGraph: {
      title: itinerary.title,
      description: itinerary.excerpt,
      images: [itinerary.image],
    },
  };
}

export default async function ItineraryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const loaded = await loadItineraryBySlug(slug);
  if (!loaded) notFound();
  const { itinerary, steps } = loaded;
  const purchased = await hasPurchased(itinerary.id, itinerary.slug);
  const locked = !purchased;

  const totalSteps = steps.length;
  const placeCount = steps.filter((s) => !!s.coords).length;
  const heroImages = Array.from(
    new Set([itinerary.image, ...(itinerary.previewImages ?? [])]),
  );

  return (
    <article className="bg-white">
      <header className="relative h-[72vh] min-h-[520px] w-full overflow-hidden font-sans">
        <HeroCarousel images={heroImages} title={itinerary.title} videoSrc={itinerary.heroVideoId} />
        <div className="pointer-events-none absolute inset-0 z-10 bg-black/35" />
        <div className="pointer-events-none absolute inset-0 z-20 section-padding flex items-center justify-center text-center">
          <div className="mx-auto max-w-[1000px] text-white">
            <Link
              href={
                itinerary.countrySlug
                  ? `/itineraries/countries/${itinerary.countrySlug}`
                  : "/itineraries"
              }
              className="pointer-events-auto inline-flex items-center justify-center gap-2 text-xs font-light uppercase tracking-[0.2em] text-white/90 hover:text-white"
            >
              <span>{itinerary.country}</span>
              {itinerary.region && (
                <>
                  <span className="opacity-50">/</span>
                  <span>{itinerary.region}</span>
                </>
              )}
            </Link>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-balance text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.7)]">
              {itinerary.title}
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-xl sm:text-[1.8rem] font-normal leading-snug text-white/95 drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)]">
              {itinerary.excerpt}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-white/85">
              {itinerary.category && (
                <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur">
                  {itinerary.category}
                </span>
              )}
              <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur">
                {itinerary.duration}
              </span>
              {!locked && (
                <>
                  <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur">
                    {placeCount} places
                  </span>
                  <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur">
                    {totalSteps} steps
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="sticky top-14 sm:top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="mx-auto max-w-[1200px] section-padding py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-foreground/50">
              {itinerary.duration} itinerary
            </p>
            <p className="text-lg font-semibold text-foreground">
              {formatPrice(itinerary.price * 100)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SaveTripButton itinerarySlug={itinerary.slug} />
            {purchased ? (
              <>
                <DownloadPdfButton slug={itinerary.slug} />
                <Link
                  href="/account/itineraries"
                  className="rounded-full bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5"
                >
                  Open in dashboard
                </Link>
              </>
            ) : (
              <BuyButton itinerarySlug={itinerary.slug} title={itinerary.title} />
            )}
          </div>
        </div>
      </section>

      <section className="section-padding py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px]">
          {locked ? (
            <PublicTeaser itinerary={itinerary} />
          ) : (
            <UnlockedItinerary itinerary={itinerary} steps={steps} />
          )}
        </div>
      </section>
    </article>
  );
}
