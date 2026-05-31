// Re-fetch every 5 minutes so newly published itineraries appear without a full redeploy
export const revalidate = 300;

import { Hero } from "@/components/home/hero";
import { Newsletter } from "@/components/home/newsletter";
import { LatestItineraries } from "@/components/home/latest-itineraries";
import { CountryCollection } from "@/components/home/country-collection";
import { ExploreByInterest } from "@/components/home/explore-by-interest";
import { HowItWorks } from "@/components/home/how-it-works";
import { Gallery } from "@/components/home/gallery";
import { TravelJournal } from "@/components/home/travel-journal";
import {
  loadBlogSliderPosts,
  loadCountryCards,
  loadGalleryCards,
  loadHeroMediaByPageSlug,
  loadPublishedItineraryCards,
} from "@/lib/marketing-content";

export default async function HomePage() {
  const [heroMedia, itineraries, countries, gallery, journalPosts] = await Promise.all([
    loadHeroMediaByPageSlug("home"),
    loadPublishedItineraryCards(10),
    loadCountryCards(),
    loadGalleryCards(12),
    loadBlogSliderPosts(10),
  ]);

  return (
    <>
      <Hero media={heroMedia} />
      <Newsletter />
      <LatestItineraries items={itineraries} />
      <ExploreByInterest itineraries={itineraries} />
      <CountryCollection items={countries} />
      <HowItWorks />
      <Gallery items={gallery} />
      <TravelJournal posts={journalPosts} />
    </>
  );
}
