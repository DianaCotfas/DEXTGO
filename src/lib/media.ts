/**
 * Resolves media references (images / videos) into a final URL.
 *
 * Behaviour:
 * - Absolute URLs (http/https/data/blob) → returned untouched.
 * - Leading-slash paths (`/images/...`) → if NEXT_PUBLIC_R2_PUBLIC_BASE is set,
 *   rewritten to that base; otherwise served from local `/public`.
 * - Non-leading paths (`uploads/...`, `audio/...`) → treated as private R2 keys
 *   and routed through `/api/media/<key>` when no public base is set.
 */

const ABSOLUTE = /^(https?:|data:|blob:)/i;

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (ABSOLUTE.test(path)) return path;

  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE;
  if (!base) {
    if (path.startsWith("/")) return path;
    const cleaned = path.replace(/^\/+/, "");
    return `/api/media/${cleaned
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")}`;
  }

  const cleanedBase = base.replace(/\/$/, "");
  const cleanedPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanedBase}${cleanedPath}`;
}
