-- ─────────────────────────────────────────────────────────────────────────────
-- DEXTGO — Move country/region covers to local static assets
-- Ensures already-provisioned databases receive the latest image path updates.
-- ─────────────────────────────────────────────────────────────────────────────

-- Countries
update public.countries set cover_url = '/images/countries-regions/italy.jpg.png' where slug = 'italy';
update public.countries set cover_url = '/images/countries-regions/romania.jpg.png' where slug = 'romania';
update public.countries set cover_url = '/images/countries-regions/hungary.jpg.png' where slug = 'hungary';
update public.countries set cover_url = '/images/countries-regions/slovenia.jpg.png' where slug = 'slovenia';
update public.countries set cover_url = '/images/countries-regions/croatia.jpg.png' where slug = 'croatia';
update public.countries set cover_url = '/images/countries-regions/france.jpg.png' where slug = 'france';
update public.countries set cover_url = '/images/countries-regions/spain.jpg.png' where slug = 'spain';
update public.countries set cover_url = '/images/countries-regions/greece.jpg.png' where slug = 'greece';

-- Regions
update public.regions set cover_url = '/images/countries-regions/italy-lazio.jpg.png' where country_slug = 'italy' and slug = 'lazio';
update public.regions set cover_url = '/images/countries-regions/italy-tuscany.jpg.png' where country_slug = 'italy' and slug = 'tuscany';
update public.regions set cover_url = '/images/countries-regions/italy-%20campania.jpg.jpg' where country_slug = 'italy' and slug = 'campania';
update public.regions set cover_url = '/images/countries-regions/italy-abruzzo.jpg.png' where country_slug = 'italy' and slug = 'abruzzo';
update public.regions set cover_url = '/images/countries-regions/italy-salento.jpg.png' where country_slug = 'italy' and slug = 'salento';
update public.regions set cover_url = '/images/countries-regions/italy-sicily.jpg' where country_slug = 'italy' and slug = 'sicily';

update public.regions set cover_url = '/images/countries-regions/romania-wallachia.jpg' where country_slug = 'romania' and slug = 'wallachia';
update public.regions set cover_url = '/images/countries-regions/romania-transylvania.jpg.png' where country_slug = 'romania' and slug = 'transylvania';
update public.regions set cover_url = '/images/countries-regions/romania-bucovina.jpg.png' where country_slug = 'romania' and slug = 'bucovina';
update public.regions set cover_url = '/images/countries-regions/romania-maramures.jpg.png' where country_slug = 'romania' and slug = 'maramures';

update public.regions set cover_url = '/images/countries-regions/hungary-central-hungary.jpg.png' where country_slug = 'hungary' and slug = 'central-hungary';
update public.regions set cover_url = '/images/countries-regions/slovenia-central-slovenia.jpg.png' where country_slug = 'slovenia' and slug = 'central-slovenia';

update public.regions set cover_url = '/images/countries-regions/croatia-zagreb.jpg.png' where country_slug = 'croatia' and slug = 'zagreb';
update public.regions set cover_url = '/images/countries-regions/croatia-central-dalmatia.jpg' where country_slug = 'croatia' and slug = 'central-dalmatia';
update public.regions set cover_url = '/images/countries-regions/croatia-istria.jpg.png' where country_slug = 'croatia' and slug = 'istria';

update public.regions set cover_url = '/images/countries-regions/france-french-riviera-cote-dazur.jpg.png' where country_slug = 'france' and slug = 'french-riviera-cote-dazur';
update public.regions set cover_url = '/images/countries-regions/france-french-alps.jpg' where country_slug = 'france' and slug = 'french-alps';

update public.regions set cover_url = '/images/countries-regions/spain-andalusia.jpg.png' where country_slug = 'spain' and slug = 'andalusia';
update public.regions set cover_url = '/images/countries-regions/spain-catalonia.jpg.png' where country_slug = 'spain' and slug = 'catalonia';
update public.regions set cover_url = '/images/countries-regions/spain-madrid.jpg' where country_slug = 'spain' and slug = 'madrid';

update public.regions set cover_url = '/images/countries-regions/greece-athens.jpg.png' where country_slug = 'greece' and slug = 'athens';
update public.regions set cover_url = '/images/countries-regions/greece-cyclades-islands.jpg' where country_slug = 'greece' and slug = 'cyclades-islands';
update public.regions set cover_url = '/images/countries-regions/greece-crete.jpg' where country_slug = 'greece' and slug = 'crete';
