-- ─────────────────────────────────────────────────────────────────────────────
-- DEXTGO — Replace remaining region remote fallbacks with local images
-- ─────────────────────────────────────────────────────────────────────────────

update public.regions
set cover_url = '/images/countries-regions/italy.jpg.png'
where country_slug = 'italy' and slug = 'veneto';

update public.regions
set cover_url = '/images/countries-regions/hungary.jpg.png'
where country_slug = 'hungary' and slug = 'balaton';

update public.regions
set cover_url = '/images/countries-regions/slovenia.jpg.png'
where country_slug = 'slovenia' and slug = 'julian-alps';
