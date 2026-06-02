import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@swc/core-linux-x64-gnu/**",
      "node_modules/@swc/core-linux-x64-musl/**",
      "node_modules/@esbuild/linux-x64/**",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90, 100],
    localPatterns: [
      // Allow ALL local paths (static images, public assets, etc.)
      // Without this entry Next.js blocks query-string URLs like /api/media/...?sig=...
      { pathname: "/**" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "media.dextgo.com" },
      { protocol: "https", hostname: "*.cloudflarestream.com" },
    ],
  },
  async redirects() {
    // Permanent 301s from the old WordPress URL structure to the new app.
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/index.php", destination: "/", permanent: true },
      { source: "/chi-siamo", destination: "/about", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contattaci", destination: "/contact", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/itinerari", destination: "/itineraries", permanent: true },
      {
        source: "/itinerari-personalizzati",
        destination: "/personalized-itineraries",
        permanent: true,
      },
      { source: "/category/:slug*", destination: "/blog", permanent: true },
      { source: "/tag/:slug*", destination: "/blog", permanent: true },
      { source: "/wp-login.php", destination: "/login", permanent: true },
      { source: "/wp-admin/:path*", destination: "/admin", permanent: true },
      { source: "/feed", destination: "/blog", permanent: true },
      { source: "/feed/:path*", destination: "/blog", permanent: true },
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/cookie-policy", destination: "/cookies", permanent: true },
      { source: "/terms-conditions", destination: "/terms", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
