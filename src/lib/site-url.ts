const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

/** Preview/staging hosts that must never be used for production auth or checkout redirects. */
const BLOCKED_PRODUCTION_HOSTS = new Set([
  "dextgo.imjunaidafzal.com",
  "imjunaidafzal.com",
]);

const PRODUCTION_SITE = "https://dextgo.com";

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "null") return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return BLOCKED_PRODUCTION_HOSTS.has(lower) || lower.endsWith(".imjunaidafzal.com");
}

function isLocalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return LOCAL_HOSTS.has(lower) || lower.endsWith(".local");
}

/**
 * Canonical public site origin for redirects, emails, and client auth callbacks.
 */
export function getPublicSiteOrigin(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];

  for (const candidate of candidates) {
    const origin = normalizeOrigin(candidate);
    if (!origin) continue;
    const { hostname } = new URL(origin);
    if (process.env.NODE_ENV === "production") {
      if (isLocalHost(hostname) || isBlockedHost(hostname)) continue;
    }
    return origin;
  }

  if (process.env.NODE_ENV === "production") return PRODUCTION_SITE;
  return "http://localhost:3000";
}

export function getPublicSiteUrl(path = ""): string {
  const base = getPublicSiteOrigin().replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
