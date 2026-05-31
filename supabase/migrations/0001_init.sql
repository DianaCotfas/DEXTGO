-- ─────────────────────────────────────────────────────────────────────────────
-- DEXTGO — Initial schema
--
-- Run inside Supabase: SQL Editor -> paste -> Run. This is idempotent (creates
-- with IF NOT EXISTS) so re-running it is safe during development.
-- ─────────────────────────────────────────────────────────────────────────────

-- Required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Profiles (1-to-1 with auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Countries
create table if not exists public.countries (
  slug        text primary key,
  name        text not null,
  tagline     text,
  description text,
  cover_url   text,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Regions (belong to a country)
create table if not exists public.regions (
  slug          text not null,
  country_slug  text not null references public.countries(slug) on delete cascade,
  name          text not null,
  tagline       text,
  description   text,
  cover_url     text,
  position      int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (country_slug, slug)
);

-- ── Itineraries (sellable products)
create table if not exists public.itineraries (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  title           text not null,
  excerpt         text,
  description     text,
  hero_image_url  text,
  hero_video_id   text,
  country_slug    text references public.countries(slug) on delete set null,
  region_slug     text,
  duration        text,
  price_cents     int not null default 0,
  currency        text not null default 'eur',
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  stripe_price_id text,
  category        text,
  category_color  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists itineraries_country_idx on public.itineraries(country_slug);
create index if not exists itineraries_region_idx  on public.itineraries(country_slug, region_slug);

-- ── Itinerary steps (color-coded blocks: blue=step, green=pin, red=audio, yellow=tip)
create table if not exists public.itinerary_steps (
  id             uuid primary key default uuid_generate_v4(),
  itinerary_id   uuid not null references public.itineraries(id) on delete cascade,
  position       int not null,
  kind           text not null check (kind in ('step','pin','audio','tip')),
  title          text not null,
  body           text,
  lat            double precision,
  lng            double precision,
  audio_url      text,
  audio_duration_seconds int,
  image_urls     text[] default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists itinerary_steps_itinerary_idx
  on public.itinerary_steps(itinerary_id, position);

-- ── Blog posts (mirror of static data; admin can edit going forward)
create table if not exists public.blog_posts (
  slug             text primary key,
  title            text not null,
  excerpt          text,
  cover_url        text,
  category         text,
  read_minutes     int,
  body             jsonb not null default '[]'::jsonb,
  seo_title        text,
  seo_description  text,
  published_at     timestamptz,
  status           text not null default 'draft' check (status in ('draft','published','archived')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Gallery (Make Your Memories homepage block)
create table if not exists public.gallery_items (
  id           uuid primary key default uuid_generate_v4(),
  image_url    text not null,
  caption      text,
  location     text,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);

-- ── Hero media (per-page hero image / video config)
create table if not exists public.hero_media (
  page_slug    text primary key,
  image_url    text,
  video_id     text,
  updated_at   timestamptz not null default now()
);

-- ── Orders (Stripe purchases)
create table if not exists public.orders (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid references auth.users(id) on delete set null,
  email                    text not null,
  itinerary_id             uuid references public.itineraries(id) on delete set null,
  stripe_session_id        text unique,
  stripe_payment_intent_id text,
  amount_cents             int not null,
  currency                 text not null default 'eur',
  status                   text not null default 'pending' check (status in ('pending','paid','refunded','failed')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_itinerary_idx on public.orders(itinerary_id);

-- ── Newsletter subscribers (mirror of Resend audience for our own records)
create table if not exists public.newsletter_subscribers (
  email        text primary key,
  consented_at timestamptz not null default now(),
  source       text default 'website',
  created_at   timestamptz not null default now()
);

-- ── Contact form submissions
create table if not exists public.contact_messages (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null,
  subject     text,
  message     text not null,
  consent     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers + triggers
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','countries','regions','itineraries','itinerary_steps',
    'blog_posts','hero_media','orders'
  ])
  loop
    execute format(
      'drop trigger if exists trg_%I_touch on public.%I;
       create trigger trg_%I_touch before update on public.%I
       for each row execute function public.touch_updated_at();',
      t, t, t, t
    );
  end loop;
end $$;

-- Profile auto-creation when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles               enable row level security;
alter table public.countries              enable row level security;
alter table public.regions                enable row level security;
alter table public.itineraries            enable row level security;
alter table public.itinerary_steps        enable row level security;
alter table public.blog_posts             enable row level security;
alter table public.gallery_items          enable row level security;
alter table public.hero_media             enable row level security;
alter table public.orders                 enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages       enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- profiles: user can read+update self; admin can read+update all
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- public marketing data: anyone can read published rows; only admins write
do $$ declare t text;
begin
  for t in select unnest(array['countries','regions','gallery_items','hero_media'])
  loop
    execute format('drop policy if exists %I_public_read on public.%I;', t, t);
    execute format(
      'create policy %I_public_read on public.%I for select using (true);',
      t, t
    );
    execute format('drop policy if exists %I_admin_write on public.%I;', t, t);
    execute format(
      'create policy %I_admin_write on public.%I for all using (public.is_admin()) with check (public.is_admin());',
      t, t
    );
  end loop;
end $$;

-- itineraries: public can read published; admins do anything
drop policy if exists itineraries_public_read on public.itineraries;
create policy itineraries_public_read on public.itineraries
  for select using (status = 'published' or public.is_admin());

drop policy if exists itineraries_admin_all on public.itineraries;
create policy itineraries_admin_all on public.itineraries
  for all using (public.is_admin()) with check (public.is_admin());

-- itinerary_steps: readable when parent itinerary is readable
drop policy if exists itinerary_steps_public_read on public.itinerary_steps;
create policy itinerary_steps_public_read on public.itinerary_steps
  for select using (
    exists (
      select 1 from public.itineraries i
      where i.id = itinerary_steps.itinerary_id
        and (i.status = 'published' or public.is_admin())
    )
  );

drop policy if exists itinerary_steps_admin_all on public.itinerary_steps;
create policy itinerary_steps_admin_all on public.itinerary_steps
  for all using (public.is_admin()) with check (public.is_admin());

-- blog: published readable to all, draft only to admin
drop policy if exists blog_public_read on public.blog_posts;
create policy blog_public_read on public.blog_posts
  for select using (status = 'published' or public.is_admin());

drop policy if exists blog_admin_all on public.blog_posts;
create policy blog_admin_all on public.blog_posts
  for all using (public.is_admin()) with check (public.is_admin());

-- orders: a user sees own; admins see all
drop policy if exists orders_self_read on public.orders;
create policy orders_self_read on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists orders_admin_write on public.orders;
create policy orders_admin_write on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

-- newsletter + contact: insert by anon (rate-limited at app layer); admin reads
drop policy if exists newsletter_anon_insert on public.newsletter_subscribers;
create policy newsletter_anon_insert on public.newsletter_subscribers
  for insert with check (true);

drop policy if exists newsletter_admin_read on public.newsletter_subscribers;
create policy newsletter_admin_read on public.newsletter_subscribers
  for select using (public.is_admin());

drop policy if exists contact_anon_insert on public.contact_messages;
create policy contact_anon_insert on public.contact_messages
  for insert with check (true);

drop policy if exists contact_admin_read on public.contact_messages;
create policy contact_admin_read on public.contact_messages
  for select using (public.is_admin());
