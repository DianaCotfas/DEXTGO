/**
 * Single source of truth for every page's hero media.
 *
 * - `image` is required and is used as a fallback + <video poster> while the clip loads.
 * - `video` is optional. When set, the hero renders an autoplaying muted loop.
 *
 * When Diana's clips are hosted (Cloudflare R2 / Stream or a dedicated public Drive),
 * fill in the `video` field per page and every hero picks it up automatically.
 */
export type HeroMedia = {
  image: string;
  /** Progressive MP4 fallback for fast first paint and broad compatibility. */
  video?: string;
  /** Optional HLS manifest for adaptive streaming (used via hls.js / Safari). */
  videoHls?: string;
  /** Optional poster shown while autoplay initializes. */
  videoPoster?: string;
};

export const HERO_MEDIA: Record<string, HeroMedia> = {
  home: {
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80",
    video: "/videos/home/hero-1080.mp4",
    videoPoster: "/videos/home/hero-poster.webp",
  },
  itineraries: {
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80",
    video: "/videos/itineraries/hero-1080.mp4",
    videoPoster: "/videos/itineraries/hero-poster.webp",
  },
  personalizedItineraries: {
    image:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80",
    video: "/videos/personalized-itineraries/hero-1080.mp4",
    videoPoster: "/videos/personalized-itineraries/hero-poster.webp",
  },
  about: {
    image:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80",
    video: "/videos/about/hero-1080.mp4",
    videoPoster: "/videos/about/hero-poster.webp",
  },
  contact: {
    image:
      "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&q=80",
    video: "/videos/contact/hero-1080.mp4",
    videoPoster: "/videos/contact/hero-poster.webp",
  },
  faq: {
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80",
    // video: "/hero/faq.mp4",
  },
  blog: {
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80",
    video: "/videos/blog/hero-1080.mp4",
    videoPoster: "/videos/blog/hero-poster.webp",
  },
} as const;
