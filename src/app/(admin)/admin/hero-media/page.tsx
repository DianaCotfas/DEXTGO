import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HeroMediaManager } from "@/components/admin/hero-media-manager";

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
  const items = PAGE_SLUGS.map((slug) => ({
    page_slug: slug,
    image_url: lookup.get(slug)?.image_url ?? "",
    video_id: lookup.get(slug)?.video_id ?? "",
  }));

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
