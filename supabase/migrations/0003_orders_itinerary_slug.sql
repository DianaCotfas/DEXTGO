-- Allow checkout/webhook flows to preserve entitlement linkage even when
-- static itineraries are purchased before matching DB rows exist.
alter table if exists public.orders
  add column if not exists itinerary_slug text;

create index if not exists orders_itinerary_slug_idx on public.orders(itinerary_slug);
