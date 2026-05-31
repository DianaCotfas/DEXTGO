import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { ItineraryRequestForm } from "@/components/forms/itinerary-request-form";
import { loadHeroMediaByPageSlug } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "Personalized Itineraries",
  description:
    "Request a custom-designed itinerary tailored to your travel style, budget, and interests. Let DEXTGO craft your perfect journey.",
};

export default async function PersonalizedItinerariesPage() {
  const heroMedia = await loadHeroMediaByPageSlug("personalized-itineraries");
  return (
    <>
      <PageHero
        title="Personalized Itineraries"
        subtitle="Tell us about your dream trip and we'll design a bespoke itinerary crafted just for you."
        backgroundImage={heroMedia.image}
        backgroundVideo={heroMedia.video}
        backgroundVideoHls={heroMedia.videoHls}
        backgroundVideoPoster={heroMedia.videoPoster ?? heroMedia.image}
      />

      <section className="section-padding section-gap">
        <div className="mx-auto max-w-2xl">
          <div className="bg-white rounded-2xl card-shadow p-8 sm:p-10">
            <ItineraryRequestForm />
          </div>
        </div>
      </section>
    </>
  );
}
