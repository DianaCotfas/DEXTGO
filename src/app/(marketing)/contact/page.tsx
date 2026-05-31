import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { ContactContent } from "@/components/contact/contact-content";
import { loadHeroMediaByPageSlug } from "@/lib/marketing-content";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the DEXTGO team. We'd love to hear from you about our itineraries or any travel questions.",
};

export default async function ContactPage() {
  const heroMedia = await loadHeroMediaByPageSlug("contact");
  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="Have a question or want to know more? We'd love to hear from you."
        backgroundImage={heroMedia.image}
        backgroundVideo={heroMedia.video}
        backgroundVideoHls={heroMedia.videoHls}
        backgroundVideoPoster={heroMedia.videoPoster ?? heroMedia.image}
      />
      <ContactContent />
    </>
  );
}
