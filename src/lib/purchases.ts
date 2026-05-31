import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns true if the current user has paid for the given itinerary.
 * Falls back to `false` (locked) when Supabase is not configured.
 */
export async function hasPurchased(
  itineraryId: string,
  itinerarySlug?: string,
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;

  const hasUuid = UUID_RE.test(itineraryId);
  const matchBy =
    itinerarySlug && hasUuid
      ? `itinerary_id.eq.${itineraryId},itinerary_slug.eq.${itinerarySlug}`
      : itinerarySlug
        ? `itinerary_slug.eq.${itinerarySlug}`
        : `itinerary_id.eq.${itineraryId}`;

  const { data } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .or(matchBy)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();
  return !!data;
}
