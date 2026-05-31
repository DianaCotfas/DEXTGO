export type ItineraryInterest = {
  slug: string;
  label: string;
  title: string;
  description: string;
  image: string;
  keywords: string[];
};

export const ITINERARY_INTERESTS: ItineraryInterest[] = [
  {
    slug: "adventure",
    label: "Adventure",
    title: "Trekking & Nature",
    description:
      "Reconnect with nature. From hidden trails to breathtaking peaks.",
    image: "/images/explore-by-itineraries/Trekking%20%26%20Nature.png",
    keywords: ["adventure", "trekking", "nature", "alps", "trekking & nature"],
  },
  {
    slug: "gastronomy",
    label: "Food",
    title: "Gastronomy",
    description:
      "Savor the world. Experience authentic flavors and local cooking.",
    image: "/images/explore-by-itineraries/Gastronomy%20.png",
    keywords: ["gastronomy", "cuisine", "food", "gastronomy and cuisine"],
  },
  {
    slug: "culture",
    label: "Culture",
    title: "Art & History",
    description: "Explore legendary museums and ancient ruins.",
    image: "/images/explore-by-itineraries/Art%20%26%20History.png",
    keywords: ["culture", "art", "history", "art & history"],
  },
  {
    slug: "family",
    label: "Family",
    title: "Family Trips",
    description: "Kid-approved adventures that create lifelong memories.",
    image: "/images/explore-by-itineraries/Family%20Trips.png",
    keywords: ["family", "family trips", "family trip"],
  },
  {
    slug: "tradition",
    label: "Tradition",
    title: "Full Immersion",
    description: "Deeply connect with traditions beyond tourist spots.",
    image: "/images/explore-by-itineraries/Full%20Immersion.png",
    keywords: ["full immersion", "tradition", "immersive", "local tradition"],
  },
];

