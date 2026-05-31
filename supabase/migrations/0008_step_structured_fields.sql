-- Diana's layered step structure: Info Data, Description (adult/kids), Expert Tips,
-- and a day-level intro. All optional, additive only.

alter table if exists public.itinerary_steps
  add column if not exists day_intro          text,
  add column if not exists info_data          text,
  add column if not exists description_long   text,
  add column if not exists description_kids   text,
  add column if not exists expert_tips        text;
