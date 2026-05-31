import { Itinerary } from "@/types";

const ROME_PREVIEW_IMAGES = [
  "/images/itineraries/rome-for-kids/rome-04.png",
  "/images/itineraries/rome-for-kids/rome-01.png",
  "/images/itineraries/rome-for-kids/rome-05.png",
  "/images/itineraries/rome-for-kids/rome-08.png",
  "/images/itineraries/rome-for-kids/rome-07.png",
  "/images/itineraries/rome-for-kids/rome-09.png",
];

const TUSCANY_PREVIEW_IMAGES = [
  "/images/itineraries/tuscany-perfect-trip/tuscany-01.png",
  "/images/itineraries/tuscany-perfect-trip/tuscany-02.png",
  "/images/itineraries/tuscany-perfect-trip/tuscany-03.png",
  "/images/itineraries/tuscany-perfect-trip/tuscany-05.png",
  "/images/itineraries/tuscany-perfect-trip/tuscany-07.png",
  "/images/itineraries/tuscany-perfect-trip/tuscany-08.png",
];

const ROMANIA_PREVIEW_IMAGES = [
  "/images/itineraries/romania-5-days/image1.jpg",
  "/images/itineraries/romania-5-days/image2.jpg",
  "/images/itineraries/romania-5-days/image3.jpg",
  "/images/itineraries/romania-5-days/image4.png",
  "/images/itineraries/romania-5-days/image5.png",
  "/images/itineraries/romania-5-days/image6.jpg",
  "/images/itineraries/romania-5-days/image7.png",
  "/images/itineraries/romania-5-days/image8.png",
  "/images/itineraries/romania-5-days/image9.jpg",
];

const NAPLES_PREVIEW_IMAGES = [
  "/images/itineraries/naples-costiera-amalfitana/image1.png",
  "/images/itineraries/naples-costiera-amalfitana/image2.png",
  "/images/itineraries/naples-costiera-amalfitana/image3.png",
  "/images/itineraries/naples-costiera-amalfitana/image4.jpg",
  "/images/itineraries/naples-costiera-amalfitana/image5.jpg",
  "/images/itineraries/naples-costiera-amalfitana/image6.jpg",
  "/images/itineraries/naples-costiera-amalfitana/image7.png",
  "/images/itineraries/naples-costiera-amalfitana/image8.png",
  "/images/itineraries/naples-costiera-amalfitana/image9.png",
  "/images/itineraries/naples-costiera-amalfitana/image10.jpg",
  "/images/itineraries/naples-costiera-amalfitana/image11.jpg",
  "/images/itineraries/naples-costiera-amalfitana/image12.jpg",
  "/images/itineraries/naples-costiera-amalfitana/image13.jpg",
];

export const featuredItineraries: Itinerary[] = [
  {
    id: "1",
    title: "The Eternal City: Family Edition",
    slug: "rome-for-kids",
    country: "Italy",
    countrySlug: "italy",
    region: "Lazio",
    regionSlug: "lazio",
    duration: "5 Days",
    price: 30,
    image: "/images/itineraries/rome-for-kids/rome-04.png",
    excerpt:
      "Rome for Kids: The 5-Day Magical Itinerary. A zero-stress family route with legendary sites, playful stops, practical logistics, and child-friendly dining.",
    category: "Italy / Lazio / Accessible Travel / Family Travel",
    previewImages: ROME_PREVIEW_IMAGES,
  },
  {
    id: "2",
    title: "Tuscany: The Perfect Trip",
    slug: "tuscany-perfect-trip",
    country: "Italy",
    countrySlug: "italy",
    region: "Tuscany",
    regionSlug: "tuscany",
    duration: "3 Days",
    price: 30,
    image: "/images/itineraries/tuscany-perfect-trip/tuscany-01.png",
    excerpt:
      "3 Days Among History, Secret Panoramas, and Authentic Flavors.",
    category: "Gastronomy and Cuisine / Accessible Travel / Full Immersion",
    previewImages: TUSCANY_PREVIEW_IMAGES,
  },
  {
    id: "3",
    title:
      "Romania: 5 Days of Art, History, and Relaxation in the Heart of the Carpathians",
    slug: "romania-5-days",
    country: "Romania",
    countrySlug: "romania",
    region: "Wallachia & Transylvania",
    duration: "5 Days",
    price: 30,
    image: "/images/itineraries/romania-5-days/image1.jpg",
    excerpt:
      "5 Days Among castles, mountain roads, and art-rich cities from Bucharest to Brașov, Sibiu, and Curtea de Argeș.",
    category: "Gastronomy and Cuisine / Full Immersion / Art & History / Family Trips",
    previewImages: ROMANIA_PREVIEW_IMAGES,
  },
  {
    id: "4",
    title: "Naples & the Amalfi Coast: 7 Days of Pure Beauty",
    slug: "naples-costiera-amalfitana",
    country: "Italy",
    countrySlug: "italy",
    region: "Campania",
    regionSlug: "campania",
    duration: "7 Days",
    price: 40,
    image: "/images/itineraries/naples-costiera-amalfitana/image1.png",
    excerpt:
      "A full-immersion 7-day route from Naples to the Amalfi Coast and Capri, curated for freedom, views, and authentic local food.",
    category: "Gastronomy and Cuisine / Full Immersion / Family Trips / Art & History",
    previewImages: NAPLES_PREVIEW_IMAGES,
  },
  {
    id: "5",
    title: "Swiss Alps",
    slug: "swiss-alps",
    country: "Switzerland",
    countrySlug: "switzerland",
    region: "Alps",
    regionSlug: "alps",
    duration: "6 Days",
    price: 35,
    image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
    excerpt:
      "6 Days Adventure Tour — conquer mountain trails, crystal lakes, and charming alpine villages.",
  },
];

export function getItinerariesByCountry(countrySlug: string): Itinerary[] {
  return featuredItineraries.filter((i) => i.countrySlug === countrySlug);
}

export function getItinerariesByRegion(
  countrySlug: string,
  regionSlug: string
): Itinerary[] {
  return featuredItineraries.filter(
    (i) => i.countrySlug === countrySlug && i.regionSlug === regionSlug
  );
}
