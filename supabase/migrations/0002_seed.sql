-- ─────────────────────────────────────────────────────────────────────────────
-- DEXTGO — Initial seed
-- Mirrors the static data currently in src/data/* so the app reads from
-- Supabase the moment we flip the data layer over. Run after 0001_init.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Countries
insert into public.countries (slug, name, tagline, cover_url, position) values
  ('italy',     'Italy',     'Where every corner becomes a story to tell.',                             '/images/countries-regions/italy.jpg.png', 1),
  ('romania',   'Romania',   'A land where legends still walk between the mountains.',                   '/images/countries-regions/romania.jpg.png', 2),
  ('hungary',   'Hungary',   'The pulse of Mitteleuropa — Budapest, Balaton, baroque squares.',          '/images/countries-regions/hungary.jpg.png', 3),
  ('slovenia',  'Slovenia',  'Alps, lakes, vines — a country that fits in your pocket.',                 '/images/countries-regions/slovenia.jpg.png', 4),
  ('croatia',   'Croatia',   'A coastline of marble, mistral and a thousand islands.',                   '/images/countries-regions/croatia.jpg.png', 5),
  ('france',    'France',    'Light, perfume, the slow art of the apéro.',                               '/images/countries-regions/france.jpg.png', 6),
  ('spain',     'Spain',     'A sunlit ode to flamenco, tapas and Moorish stone.',                       '/images/countries-regions/spain.jpg.png', 7),
  ('greece',    'Greece',    'Where blue is a verb and history sits next to lunch.',                     '/images/countries-regions/greece.jpg.png', 8)
on conflict (slug) do update set
  name=excluded.name, tagline=excluded.tagline, cover_url=excluded.cover_url, position=excluded.position;

-- ── Regions
insert into public.regions (country_slug, slug, name, tagline, cover_url, position) values
  ('italy','lazio','Lazio','Rome and the kingdom of fountains.','/images/countries-regions/italy-lazio.jpg.png',1),
  ('italy','tuscany','Tuscany','Cypresses, golden hills, and a thousand vineyards.','/images/countries-regions/italy-tuscany.jpg.png',2),
  ('italy','veneto','Veneto','Venice, the Dolomites, prosecco country.','/images/countries-regions/italy.jpg.png',3),
  ('italy','campania','Campania','Naples, Amalfi, Pompeii — operatic Italy.','/images/countries-regions/italy-%20campania.jpg.jpg',4),
  ('italy','abruzzo','Abruzzo','Wild national parks, mountain villages, and Adriatic coastline.','/images/countries-regions/italy-abruzzo.jpg.png',5),
  ('italy','salento','Salento','Baroque Lecce, turquoise coves, and southern Puglia.','/images/countries-regions/italy-salento.jpg.png',6),
  ('italy','sicily','Sicily','Ancient temples, volcanic landscapes, and island culture.','/images/countries-regions/italy-sicily.jpg',7),
  ('romania','wallachia','Wallachia','Bucharest and the cultural spine of southern Romania.','/images/countries-regions/romania-wallachia.jpg',1),
  ('romania','transylvania','Transylvania','Castles in mist, painted villages, mountain trails.','/images/countries-regions/romania-transylvania.jpg.png',2),
  ('romania','bucovina','Bucovina','Painted monasteries hidden in green hills.','/images/countries-regions/romania-bucovina.jpg.png',3),
  ('romania','maramures','Maramures','Wooden churches and a slower century.','/images/countries-regions/romania-maramures.jpg.png',4),
  ('hungary','central-hungary','Central Hungary','Budapest thermal baths and Danube bridges.','/images/countries-regions/hungary-central-hungary.jpg.png',1),
  ('hungary','balaton','Balaton','The inland sea of Central Europe.','/images/countries-regions/hungary.jpg.png',2),
  ('slovenia','julian-alps','Julian Alps','Lake Bled, Triglav, and storybook valleys.','/images/countries-regions/slovenia.jpg.png',1),
  ('slovenia','central-slovenia','Central Slovenia','Ljubljana and central castle-country escapes.','/images/countries-regions/slovenia-central-slovenia.jpg.png',2),
  ('croatia','zagreb','Zagreb','Grand boulevards, museums, and café terraces.','/images/countries-regions/croatia-zagreb.jpg.png',1),
  ('croatia','istria','Istria','Truffles, vineyards, the quiet other Adriatic.','/images/countries-regions/croatia-istria.jpg.png',2),
  ('croatia','central-dalmatia','Central Dalmatia','Split, islands, and limestone villages.','/images/countries-regions/croatia-central-dalmatia.jpg',3),
  ('france','french-riviera-cote-dazur','French Riviera / Cote d''Azur','Mediterranean glamour from Nice to Cannes.','/images/countries-regions/france-french-riviera-cote-dazur.jpg.png',1),
  ('france','french-alps','French Alps','Alpine lakes, mountain villages, and panoramic trails.','/images/countries-regions/france-french-alps.jpg',2),
  ('spain','andalusia','Andalusia','Flamenco, Alhambra, white villages.','/images/countries-regions/spain-andalusia.jpg.png',1),
  ('spain','catalonia','Catalonia','Barcelona, Costa Brava, Pyrenees.','/images/countries-regions/spain-catalonia.jpg.png',2),
  ('spain','madrid','Madrid','Royal boulevards, museums, and late-night energy.','/images/countries-regions/spain-madrid.jpg',3),
  ('greece','athens','Athens','Acropolis vistas and neoclassical districts.','/images/countries-regions/greece-athens.jpg.png',1),
  ('greece','cyclades-islands','Cyclades Islands','Whitewashed islands afloat in cobalt.','/images/countries-regions/greece-cyclades-islands.jpg',2),
  ('greece','crete','Crete','Minoan heritage and mountain-to-sea routes.','/images/countries-regions/greece-crete.jpg',3)
on conflict (country_slug, slug) do update set
  name=excluded.name, tagline=excluded.tagline, cover_url=excluded.cover_url, position=excluded.position;

-- ── Hero media (page-level)
insert into public.hero_media (page_slug, image_url) values
  ('home',                    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=2000&q=80'),
  ('itineraries',             'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=2000&q=80'),
  ('about',                   'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=2000&q=80'),
  ('contact',                 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=2000&q=80'),
  ('faq',                     'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=2000&q=80'),
  ('blog',                    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=2000&q=80'),
  ('personalized-itineraries','https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=2000&q=80')
on conflict (page_slug) do update set image_url = excluded.image_url;
