export interface Region {
  name: string;
  slug: string;
  tagline: string;
  image: string;
  /** Long-form intro shown on the region detail page. */
  description?: string;
  /** Optional gallery shown beneath the region intro. */
  gallery?: string[];
  /** Bullet points of "what you'll experience" / highlights. */
  highlights?: string[];
}

export interface Country {
  name: string;
  slug: string;
  tagline: string;
  image: string;
  regions?: Region[];
}

export type ItineraryStepKind = "step" | "pin" | "audio" | "tip";

/** Color tokens matching the 90-page doc legend. */
export const STEP_COLORS: Record<
  ItineraryStepKind,
  { name: string; hex: string; bg: string; ring: string; label: string }
> = {
  step:  { name: "blue",   hex: "#0A84FF", bg: "bg-[#0A84FF]/10", ring: "ring-[#0A84FF]/30", label: "Step" },
  pin:   { name: "green",  hex: "#30D158", bg: "bg-[#30D158]/12", ring: "ring-[#30D158]/30", label: "Place" },
  audio: { name: "red",    hex: "#FF453A", bg: "bg-[#FF453A]/10", ring: "ring-[#FF453A]/30", label: "Audio" },
  tip:   { name: "yellow", hex: "#FFD60A", bg: "bg-[#FFD60A]/15", ring: "ring-[#FFD60A]/40", label: "Tip" },
};

export interface Coords {
  lat: number;
  lng: number;
}

export interface ItineraryStep {
  id: string;
  position: number;
  kind: ItineraryStepKind;
  title: string;
  body?: string;
  coords?: Coords;
  audioUrl?: string;
  audioDurationSeconds?: number;
  images?: string[];
  /** 1-based day grouping. Steps without `day` collapse into "Day 1". */
  day?: number;
  /** Optional headline shown above the day's map (e.g. "Angels, Popes, and Ancient History"). */
  dayTitle?: string;
  /** Optional day-level introduction text rendered under the day heading. */
  dayIntro?: string;
  /** Direct link to the place's official website. */
  officialUrl?: string;
  /** Pre-built Google Maps URL for the stop. */
  googleMapsUrl?: string;
  /** Human-readable street address. */
  address?: string;
  /** Detailed operational info shown in "Info Data". */
  infoData?: string;
  /** Main long-form narration shown in "Description and Audio". */
  descriptionAndAudio?: string;
  /** Optional children-focused narration shown as a separate section. */
  descriptionAndAudioKids?: string;
  /** Expert notes shown in a dedicated collapsible tips section. */
  expertTips?: string;
  /** Additional links (websites, maps, etc.) for this step. */
  extraLinks?: ExtraLink[];
}

export interface ExtraLink {
  label: string;
  url: string;
}

export interface PointOfInterest {
  name: string;
  address?: string;
  phone?: string;
  hours?: string;
  url?: string;
  coords?: Coords;
}

export interface CustomExtrasSection {
  title: string;
  items: PointOfInterest[];
}

export interface EmergencyNumber {
  label: string;
  number: string;
  description?: string;
}

export interface TeaserFeature {
  title: string;
  body: string;
}

export interface PublicTeaserContent {
  subtitle?: string;
  lockedTitle?: string;
  lockedIntro?: string;
  leftFeatures?: TeaserFeature[];
  lockedFeatures?: TeaserFeature[];
}

export interface ItineraryExtras {
  pharmacies?: PointOfInterest[];
  hospitals?: PointOfInterest[];
  emergencyNumbers?: EmergencyNumber[];
  publicTeaser?: PublicTeaserContent;
  /** Free-form custom sections (e.g. Supermarkets, Packing Tips). */
  customSections?: CustomExtrasSection[];
}

export interface Itinerary {
  id: string;
  title: string;
  slug: string;
  country: string;
  countrySlug?: string;
  region: string;
  regionSlug?: string;
  duration: string;
  price: number;
  image: string;
  excerpt: string;
  description?: string;
  /** Long-form sales copy shown on the public teaser (Page 1 of Diana's docs). */
  salesPreview?: string;
  /** Photo gallery shown on the public teaser. */
  previewImages?: string[];
  /** Practical info (pharmacies, hospitals, emergency numbers) shown after the last day. */
  extras?: ItineraryExtras;
  heroVideoId?: string;
  category?: string;
  steps?: ItineraryStep[];
}

export type BlogBlock =
  | { type: "heading"; level?: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; alt?: string; caption?: string };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  readTime: string;
  category: string;
  seoTitle?: string;
  seoDescription?: string;
  body?: BlogBlock[];
  gallery?: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  category: string;
  items: FAQItem[];
}
