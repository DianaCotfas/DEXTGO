import type { NextRequest } from "next/server";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

function firstHeader(request: NextRequest, key: string): string | null {
  const value = request.headers.get(key);
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

function parseCandidate(value: string | null | undefined): URL | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "null") return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isLocalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return LOCAL_HOSTS.has(lower) || lower.endsWith(".local");
}

/**
 * Resolve the public origin used by auth redirects.
 * In production, local/internal hosts are ignored to prevent 0.0.0.0 callbacks.
 */
export function resolveAuthRedirectOrigin(request: NextRequest): string {
  const forwardedHost = firstHeader(request, "x-forwarded-host");
  const forwardedProto = firstHeader(request, "x-forwarded-proto") || "https";
  const host = firstHeader(request, "host");
  const requestProto = request.nextUrl.protocol.replace(/:$/, "") || "https";

  const candidates = [
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL,
    process.env.AUTH_REDIRECT_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    firstHeader(request, "origin"),
    forwardedHost ? `${forwardedProto}://${forwardedHost}` : null,
    host ? `${requestProto}://${host}` : null,
    request.nextUrl.origin,
  ];

  for (const candidate of candidates) {
    const parsed = parseCandidate(candidate);
    if (!parsed) continue;
    if (process.env.NODE_ENV === "production" && isLocalHostname(parsed.hostname)) {
      continue;
    }
    return parsed.origin;
  }

  return request.nextUrl.origin;
}
