-- Diana's itinerary spec: day grouping, sales preview/teaser, and Extras.

-- Step-level fields ---------------------------------------------------------
alter table if exists public.itinerary_steps
  add column if not exists day int,
  add column if not exists day_title text,
  add column if not exists official_url text,
  add column if not exists google_maps_url text,
  add column if not exists address text;

create index if not exists itinerary_steps_day_idx
  on public.itinerary_steps(itinerary_id, day, position);

-- Itinerary-level fields ----------------------------------------------------
alter table if exists public.itineraries
  add column if not exists sales_preview text,
  add column if not exists preview_image_urls text[] not null default '{}',
  add column if not exists extras jsonb;
