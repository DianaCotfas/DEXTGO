import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { FAQContent } from "@/components/faq/faq-content";
import { loadHeroMediaByPageSlug } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Find answers to frequently asked questions about DEXTGO itineraries, purchases, audio guides, and more.",
};

export default async function FAQPage() {
  const heroMedia = await loadHeroMediaByPageSlug("faq");
  return (
    <>
      <PageHero
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about DEXTGO and our itineraries."
        backgroundImage={heroMedia.image}
        backgroundVideo={heroMedia.video}
      />
      <FAQContent />
    </>
  );
}
