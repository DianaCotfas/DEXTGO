export const SITE_CONFIG = {
  name: "DEXTGO",
  tagline: "Wander and Navigate Destinations",
  description:
    "Discover unforgettable ready-made and custom-designed itineraries. Expert-curated travel experiences with interactive maps, audio guides, and insider tips.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://dextgo.com",
  email: "info@dextgo.com",
  supportEmail: "support@dextgo.com",
  vat: "IT01629850528",
  address: "Via San Benedetto 51, 53100 Siena, Italy",
  owner: "Diana Cotfas",
  pec: "dianacotfas@pec.it",
  odrUrl: "https://ec.europa.eu/consumers/odr/",
  social: {
    facebook: "https://www.facebook.com/share/18Asq8Vvzs/",
    instagram: "https://www.instagram.com/dextgo_travel/",
    tiktok: "https://www.tiktok.com/@dextgo",
  },
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Itineraries", href: "/itineraries" },
  { label: "Personalized Itineraries", href: "/personalized-itineraries" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQs", href: "/faq" },
] as const;

export const FOOTER_LINKS = {
  important: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms and Conditions", href: "/terms" },
    { label: "Cookies Policy", href: "/cookies" },
    { label: "Refund Request", href: "/contact?subject=refund" },
    {
      label: "Online Dispute Resolution",
      href: "https://ec.europa.eu/consumers/odr/",
      external: true,
    },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Blog", href: "/blog" },
    { label: "FAQs", href: "/faq" },
    { label: "All Itineraries", href: "/itineraries" },
  ],
} as const;
