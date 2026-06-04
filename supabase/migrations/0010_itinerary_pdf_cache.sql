alter table public.itineraries
  add column if not exists pdf_r2_key text,
  add column if not exists pdf_generated_at timestamptz;

comment on column public.itineraries.pdf_r2_key is
  'Cloudflare R2 object key for the pre-generated downloadable PDF.';

comment on column public.itineraries.pdf_generated_at is
  'Timestamp of the last successful PDF generation for this itinerary.';
