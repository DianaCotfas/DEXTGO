import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { AboutContent } from "@/components/about/about-content";
import { loadHeroMediaByPageSlug } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about DEXTGO's mission to deliver expertly curated, conscious, and inclusive travel experiences across Europe.",
};

export default async function AboutPage() {
  const heroMedia = await loadHeroMediaByPageSlug("about");
  return (
    <>
      <PageHero
        title="About DEXTGO"
        subtitle="Travel is not just about destinations — it's about how you experience them."
        backgroundImage={heroMedia.image}
        backgroundVideo={heroMedia.video}
        backgroundVideoHls={heroMedia.videoHls}
        backgroundVideoPoster={heroMedia.videoPoster ?? heroMedia.image}
      />
      <AboutContent />
    </>
  );
}
