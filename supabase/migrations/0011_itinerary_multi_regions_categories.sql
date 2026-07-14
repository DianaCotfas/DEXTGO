-- Allow itineraries to belong to multiple regions and interest categories.

alter table public.itineraries
  add column if not exists region_slugs text[] not null default '{}',
  add column if not exists categories text[] not null default '{}';

-- Backfill from legacy single-value fields.
update public.itineraries
set region_slugs = array[region_slug]
where coalesce(array_length(region_slugs, 1), 0) = 0
  and region_slug is not null
  and btrim(region_slug) <> '';

update public.itineraries
set categories = array[category]
where coalesce(array_length(categories, 1), 0) = 0
  and category is not null
  and btrim(category) <> '';

create index if not exists itineraries_region_slugs_idx
  on public.itineraries using gin (region_slugs);

create index if not exists itineraries_categories_idx
  on public.itineraries using gin (categories);
