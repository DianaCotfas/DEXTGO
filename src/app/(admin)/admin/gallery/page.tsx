import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { resolveR2Url } from "@/lib/r2";

export const metadata = { title: "Gallery — Admin DEXTGO" };

export default async function AdminGalleryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: items } = supabase
    ? await supabase.from("gallery_items").select("*").order("position")
    : { data: null };
  const resolvedItems = (items ?? []).map((item) => ({
    ...item,
    image_url: resolveR2Url(item.image_url),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
        <p className="text-sm text-foreground/60">
          Photos shown in the homepage &ldquo;Make Your Memories&rdquo; block.
        </p>
      </header>
      <GalleryManager initialItems={resolvedItems} />
    </div>
  );
}
