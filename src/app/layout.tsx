import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CookieConsent } from "@/components/shared/cookie-consent";
import { IubendaBanner } from "@/components/shared/iubenda-banner";
import { hasIubendaBanner } from "@/lib/iubenda";
import { getPublicSiteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DEXTGO — Wander and Navigate Destinations",
    template: "%s | DEXTGO",
  },
  description:
    "Discover unforgettable ready-made and custom-designed itineraries. Expert-curated travel experiences with interactive maps, audio guides, and insider tips.",
  metadataBase: new URL(getPublicSiteUrl()),
  icons: {
    icon: [{ url: "/brand/dextgo-icon.png", type: "image/png" }],
    apple: [{ url: "/brand/dextgo-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "DEXTGO — Wander and Navigate Destinations",
    description:
      "Discover unforgettable ready-made and custom-designed itineraries.",
    siteName: "DEXTGO",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        {hasIubendaBanner() ? <IubendaBanner /> : <CookieConsent />}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
