-- ─────────────────────────────────────────────────────────────────────────────
-- DEXTGO — Saved trips (favorites)
-- Lets signed-in users bookmark itineraries by slug across devices.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.saved_trips (
  user_id         uuid not null references auth.users(id) on delete cascade,
  itinerary_slug  text not null,
  created_at      timestamptz not null default now(),
  primary key (user_id, itinerary_slug)
);

create index if not exists saved_trips_user_idx
  on public.saved_trips(user_id, created_at desc);

alter table public.saved_trips enable row level security;

drop policy if exists saved_trips_self_read on public.saved_trips;
create policy saved_trips_self_read on public.saved_trips
  for select using (auth.uid() = user_id);

drop policy if exists saved_trips_self_insert on public.saved_trips;
create policy saved_trips_self_insert on public.saved_trips
  for insert with check (auth.uid() = user_id);

drop policy if exists saved_trips_self_delete on public.saved_trips;
create policy saved_trips_self_delete on public.saved_trips
  for delete using (auth.uid() = user_id);
