import { Country } from "@/types";

export const countries: Country[] = [
  {
    name: "Italy",
    slug: "italy",
    tagline:
      "Experience the Mediterranean, from Tuscan hills to Sicilian shores.",
    image: "/images/countries-regions/italy.jpg.png",
    regions: [
      {
        name: "Lazio",
        slug: "lazio",
        tagline:
          "Rome, the Eternal City — fountains, aqueducts, and Caravaggio's masterpieces.",
        image: "/images/countries-regions/italy-lazio.jpg.png",
      },
      {
        name: "Tuscany",
        slug: "tuscany",
        tagline: "Rolling hills, Renaissance cities, and timeless vineyards.",
        image: "/images/countries-regions/italy-tuscany.jpg.png",
      },
      {
        name: "Veneto",
        slug: "veneto",
        tagline: "Venice's canals, the Dolomites, and Palladian villas.",
        image: "/images/countries-regions/italy.jpg.png",
      },
      {
        name: "Campania",
        slug: "campania",
        tagline: "The Amalfi Coast, Pompeii, and the bay of Naples.",
        image: "/images/countries-regions/italy-%20campania.jpg.jpg",
      },
      {
        name: "Abruzzo",
        slug: "abruzzo",
        tagline: "Wild national parks, mountain villages, and Adriatic coastline.",
        image: "/images/countries-regions/italy-abruzzo.jpg.png",
      },
      {
        name: "Salento",
        slug: "salento",
        tagline:
          "Baroque Lecce, turquoise coves, and the slow rhythm of southern Puglia.",
        image: "/images/countries-regions/italy-salento.jpg.png",
      },
      {
        name: "Sicily",
        slug: "sicily",
        tagline:
          "Ancient temples, volcanic landscapes, and Mediterranean island culture.",
        image: "/images/countries-regions/italy-sicily.jpg",
      },
    ],
  },
  {
    name: "Romania",
    slug: "romania",
    tagline:
      "Discover legendary castles and the untouched beauty of the Carpathians.",
    image: "/images/countries-regions/romania.jpg.png",
    regions: [
      {
        name: "Wallachia",
        slug: "wallachia",
        tagline:
          "Bucharest, Curtea de Arges, and the cultural spine of southern Romania.",
        image: "/images/countries-regions/romania-wallachia.jpg",
      },
      {
        name: "Transylvania",
        slug: "transylvania",
        tagline:
          "Peles and Bran castles, Salina Turda, and the heart of Dracula's legend.",
        image: "/images/countries-regions/romania-transylvania.jpg.png",
      },
      {
        name: "Bucovina",
        slug: "bucovina",
        tagline: "Painted monasteries and the fairytale landscapes of the north.",
        image: "/images/countries-regions/romania-bucovina.jpg.png",
      },
      {
        name: "Maramures",
        slug: "maramures",
        tagline: "Wooden churches and living traditions in Romania's most authentic region.",
        image: "/images/countries-regions/romania-maramures.jpg.png",
      },
    ],
  },
  {
    name: "Hungary",
    slug: "hungary",
    tagline:
      "Explore the thermal wonders of Budapest and the historic charm of the Danube.",
    image: "/images/countries-regions/hungary.jpg.png",
    regions: [
      {
        name: "Central Hungary",
        slug: "central-hungary",
        tagline:
          "Budapest's thermal baths, Danube bridges, and elegant café culture.",
        image: "/images/countries-regions/hungary-central-hungary.jpg.png",
      },
      {
        name: "Lake Balaton",
        slug: "balaton",
        tagline: "Central Europe's largest lake and the heart of Hungarian wine country.",
        image: "/images/countries-regions/hungary.jpg.png",
      },
    ],
  },
  {
    name: "Slovenia",
    slug: "slovenia",
    tagline:
      "From emerald lakes to the Julian Alps, discover Europe's hidden green heart.",
    image: "/images/countries-regions/slovenia.jpg.png",
    regions: [
      {
        name: "Julian Alps",
        slug: "julian-alps",
        tagline: "Lake Bled, Triglav National Park, and alpine adventures.",
        image: "/images/countries-regions/slovenia.jpg.png",
      },
      {
        name: "Central Slovenia",
        slug: "central-slovenia",
        tagline:
          "Ljubljana, cave castles, and postcard villages at Slovenia's core.",
        image: "/images/countries-regions/slovenia-central-slovenia.jpg.png",
      },
    ],
  },
  {
    name: "Croatia",
    slug: "croatia",
    tagline:
      "Sail through the sapphire Adriatic and walk the ancient stone walls of Dalmatia.",
    image: "/images/countries-regions/croatia.jpg.png",
    regions: [
      {
        name: "Zagreb",
        slug: "zagreb",
        tagline:
          "Croatia's elegant capital of grand boulevards, museums, and café terraces.",
        image: "/images/countries-regions/croatia-zagreb.jpg.png",
      },
      {
        name: "Central Dalmatia",
        slug: "central-dalmatia",
        tagline: "Split, coastal islands, and limestone villages by the Adriatic.",
        image: "/images/countries-regions/croatia-central-dalmatia.jpg",
      },
      {
        name: "Istria",
        slug: "istria",
        tagline: "Truffle country, Roman amphitheaters, and coastal villages.",
        image: "/images/countries-regions/croatia-istria.jpg.png",
      },
    ],
  },
  {
    name: "France",
    slug: "france",
    tagline:
      "Indulge in the glamour of the French Riviera and snow-capped Alpine peaks.",
    image: "/images/countries-regions/france.jpg.png",
    regions: [
      {
        name: "French Riviera / Cote d'Azur",
        slug: "french-riviera-cote-dazur",
        tagline:
          "Nice, Cannes, and Mediterranean glamour along France's southern coast.",
        image: "/images/countries-regions/france-french-riviera-cote-dazur.jpg.png",
      },
      {
        name: "French Alps",
        slug: "french-alps",
        tagline:
          "Alpine lakes, mountain villages, and high-altitude panoramas year-round.",
        image: "/images/countries-regions/france-french-alps.jpg",
      },
    ],
  },
  {
    name: "Spain",
    slug: "spain",
    tagline:
      "From the rhythmic heart of Andalusia to the vibrant streets of Madrid and Catalonia.",
    image: "/images/countries-regions/spain.jpg.png",
    regions: [
      {
        name: "Andalusia",
        slug: "andalusia",
        tagline: "Seville, Granada's Alhambra, and flamenco soul.",
        image: "/images/countries-regions/spain-andalusia.jpg.png",
      },
      {
        name: "Catalonia",
        slug: "catalonia",
        tagline: "Barcelona's Gaudí masterpieces and the Costa Brava.",
        image: "/images/countries-regions/spain-catalonia.jpg.png",
      },
      {
        name: "Madrid",
        slug: "madrid",
        tagline:
          "Royal boulevards, world-class museums, and late-night Spanish energy.",
        image: "/images/countries-regions/spain-madrid.jpg",
      },
    ],
  },
  {
    name: "Switzerland",
    slug: "switzerland",
    tagline:
      "Snow-capped peaks, mirror lakes, and a railway network that turns the country into a living postcard.",
    image:
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=80",
    regions: [
      {
        name: "Alps",
        slug: "alps",
        tagline:
          "Zermatt, Jungfrau, and the Bernese Oberland — the cleanest mountain air you'll ever breathe.",
        image:
          "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=80",
      },
    ],
  },
  {
    name: "Greece",
    slug: "greece",
    tagline:
      "Discover the mythic ruins of Athens and white-washed islands of the Cyclades.",
    image: "/images/countries-regions/greece.jpg.png",
    regions: [
      {
        name: "Athens",
        slug: "athens",
        tagline:
          "Acropolis vistas, neoclassical streets, and the timeless pulse of Attica.",
        image: "/images/countries-regions/greece-athens.jpg.png",
      },
      {
        name: "Cyclades Islands",
        slug: "cyclades-islands",
        tagline: "Santorini, Mykonos, and iconic whitewashed Aegean villages.",
        image: "/images/countries-regions/greece-cyclades-islands.jpg",
      },
      {
        name: "Crete",
        slug: "crete",
        tagline: "Minoan heritage, pink-sand beaches, and mountain-to-sea routes.",
        image: "/images/countries-regions/greece-crete.jpg",
      },
    ],
  },
];

export function getCountry(slug: string): Country | undefined {
  return countries.find((c) => c.slug === slug);
}

export function getRegion(countrySlug: string, regionSlug: string) {
  const country = getCountry(countrySlug);
  if (!country) return { country: undefined, region: undefined };
  const region = country.regions?.find((r) => r.slug === regionSlug);
  return { country, region };
}
