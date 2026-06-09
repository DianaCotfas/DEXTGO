import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HeroMediaManager } from "@/components/admin/hero-media-manager";
import { HERO_MEDIA } from "@/lib/hero-media";

export const metadata = { title: "Hero media — Admin DEXTGO" };

const PAGE_SLUGS = [
  "home",
  "itineraries",
  "about",
  "contact",
  "faq",
  "blog",
  "personalized-itineraries",
];

export default async function AdminHeroMediaPage() {
  const supabase = await createSupabaseServerClient();
  const { data: rows } = supabase
    ? await supabase.from("hero_media").select("*")
    : { data: null };

  const lookup = new Map(
    (rows ?? []).map((r) => [r.page_slug, r] as const),
  );
  const items = PAGE_SLUGS.map((slug) => {
    const fallbackKey = slug === "personalized-itineraries" ? "personalizedItineraries" : slug;
    const fallback =
      HERO_MEDIA[fallbackKey as keyof typeof HERO_MEDIA]?.video ??
      HERO_MEDIA[fallbackKey as keyof typeof HERO_MEDIA]?.videoHls ??
      "";
    return {
      page_slug: slug,
      image_url: lookup.get(slug)?.image_url ?? "",
      video_id: lookup.get(slug)?.video_id ?? "",
      fallback_video: fallback,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Hero media</h1>
        <p className="text-sm text-foreground/60">
          Per-page hero images and video sources (Stream UID, HLS, or MP4).
        </p>
      </header>
      <HeroMediaManager items={items} />
    </div>
  );
}
