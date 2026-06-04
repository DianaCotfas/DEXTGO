import { notFound, redirect } from "next/navigation";
import { loadItineraryBySlug } from "@/lib/itineraries/loader";
import { getCurrentUser } from "@/lib/auth";
import { hasPurchased } from "@/lib/purchases";
import { PrintView } from "@/components/itinerary/print-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ItineraryPrintPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/itineraries/${slug}/print`)}`);
  }

  const loaded = await loadItineraryBySlug(slug);
  if (!loaded) notFound();

  const allowed =
    user.is_admin ||
    (await hasPurchased(loaded.itinerary.id, loaded.itinerary.slug));
  if (!allowed) {
    redirect(`/itineraries/${slug}`);
  }

  return <PrintView itinerary={loaded.itinerary} steps={loaded.steps} />;
}
