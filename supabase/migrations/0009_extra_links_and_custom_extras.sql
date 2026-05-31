-- Add extra_links (multiple URLs per step) and custom_extras sections support.

alter table if exists public.itinerary_steps
  add column if not exists extra_links jsonb;

-- custom_extras (free-form practical info sections) is stored inside the
-- existing `extras` jsonb column on the itineraries table as the key
-- "customSections", so no schema change needed there.
