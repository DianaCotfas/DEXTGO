import type { ItineraryStep } from "@/types";

/**
 * Static step fallback — intentionally empty.
 * All step content must be entered via the CMS (Supabase itinerary_steps).
 * Do not add hardcoded step bodies here; they would appear on the live site
 * whenever the DB fetch fails or the itinerary has no CMS steps yet.
 */
export const ITINERARY_STEPS: Record<string, ItineraryStep[]> = {};
