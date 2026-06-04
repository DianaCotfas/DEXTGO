import { promises as fs } from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function mimeFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

function sniffMime(buffer: Buffer): string | null {
  if (buffer.length >= 8) {
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
    if (isPng) return "image/png";
  }
  if (buffer.length >= 3) {
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (isJpeg) return "image/jpeg";
  }
  return null;
}

function normalizeForPdf(buffer: Buffer, hintedMime?: string | null) {
  const mime = sniffMime(buffer) ?? hintedMime ?? "application/octet-stream";
  if (mime === "image/png" || mime === "image/jpeg") {
    return { mime, buffer };
  }
  return null;
}

async function readLocalAsDataUrl(localPath: string) {
  const safe = localPath.replace(/^\/+/, "");
  const absolute = path.join(PUBLIC_DIR, safe);
  if (!absolute.startsWith(PUBLIC_DIR)) return null;
  try {
    const buffer = await fs.readFile(absolute);
    const normalized = normalizeForPdf(buffer, mimeFor(absolute));
    if (!normalized) return null;
    return `data:${normalized.mime};base64,${normalized.buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

async function fetchRemoteAsDataUrl(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type");
    const buffer = Buffer.from(await response.arrayBuffer());
    const normalized = normalizeForPdf(buffer, contentType);
    if (!normalized) return null;
    return `data:${normalized.mime};base64,${normalized.buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Resolves an image URL into a value that @react-pdf/renderer can embed
 * reliably. Local /public assets are read from disk; remote URLs are fetched
 * server-side to bypass Next's image optimizer (which serves AVIF/WebP that
 * react-pdf can't decode and produces "Unknown version 65280" errors).
 */
export async function resolvePdfImage(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("/")) return readLocalAsDataUrl(url);
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return fetchRemoteAsDataUrl(url);
  }
  return null;
}

export async function resolvePdfImages(urls: string[] | undefined) {
  if (!urls?.length) return [];
  const resolved = await Promise.all(urls.map((u) => resolvePdfImage(u)));
  return resolved.filter((v): v is string => !!v);
}
