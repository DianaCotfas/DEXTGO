/**
 * Cloudflare R2 helper — S3-compatible image/asset storage for DEXTGO.
 *
 * Delivery modes:
 * - Public bucket: set NEXT_PUBLIC_R2_PUBLIC_BASE and URLs resolve directly.
 * - Private bucket: leave NEXT_PUBLIC_R2_PUBLIC_BASE empty and URLs resolve to
 *   the in-app proxy route `/api/media/<key>`.
 *
 * The S3 client is loaded lazily so environments without R2 credentials don't
 * fail to boot.
 */

import { env, isConfigured, requireEnv } from "@/lib/env";
import { createHmac, timingSafeEqual } from "node:crypto";

type R2Client = import("@aws-sdk/client-s3").S3Client;

const DEFAULT_MEDIA_TTL_SECONDS = 365 * 24 * 60 * 60;

export interface UploadResult {
  key: string;
  publicUrl: string;
  contentType: string;
  size: number;
}

/** Resolve a stored key (or full URL) to a browser-loadable URL. */
export function resolveR2Url(keyOrUrl: string): string {
  if (!keyOrUrl) return "";
  if (/^https?:\/\//.test(keyOrUrl)) return keyOrUrl;
  // Keep app-local public assets untouched (e.g. /images/*, /videos/*).
  if (keyOrUrl.startsWith("/") && !keyOrUrl.startsWith("/api/media/")) {
    return keyOrUrl;
  }
  if (keyOrUrl.startsWith("/api/media/")) {
    const [pathOnly] = keyOrUrl.split("?");
    const key = pathOnly.replace(/^\/api\/media\//, "");
    return signMediaPath(key);
  }
  const base = env.NEXT_PUBLIC_R2_PUBLIC_BASE.replace(/\/$/, "");
  if (!base) {
    const cleanKey = keyOrUrl.replace(/^\/+/, "");
    return signMediaPath(cleanKey);
  }
  const path = keyOrUrl.replace(/^\//, "");
  return `${base}/${path}`;
}

function mediaSigningSecret() {
  return (
    env.MEDIA_PROXY_SIGNING_SECRET ||
    env.R2_SECRET_ACCESS_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    "dextgo-dev-media-secret"
  );
}

export function mediaTtlSeconds() {
  const parsed = Number.parseInt(env.MEDIA_PROXY_TTL_SECONDS, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MEDIA_TTL_SECONDS;
  return parsed;
}

function signPayload(key: string, exp: number) {
  return createHmac("sha256", mediaSigningSecret())
    .update(`${key}:${exp}`)
    .digest("hex");
}

export function signMediaPath(keyOrUrl: string, ttlSeconds = mediaTtlSeconds()) {
  const key = keyOrUrl
    .replace(/^\/api\/media\//, "")
    .replace(/^\/+/, "");
  const encodedKey = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  // Use a stable expiry window so URLs are cacheable across users.
  // Without this, every request generates a unique URL and defeats CDN sharing.
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowSeconds = 60 * 60;
  const roundedNow = Math.floor(nowSeconds / windowSeconds) * windowSeconds;
  const exp = roundedNow + ttlSeconds;
  const sig = signPayload(key, exp);
  return `/api/media/${encodedKey}?exp=${exp}&sig=${sig}`;
}

export function verifyMediaSignature(key: string, exp: string | null, sig: string | null) {
  if (!exp || !sig) return false;
  const expNumber = Number.parseInt(exp, 10);
  if (!Number.isFinite(expNumber)) return false;
  if (expNumber < Math.floor(Date.now() / 1000)) return false;
  const expected = signPayload(key, expNumber);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

async function createR2Client(): Promise<{ client: R2Client; bucket: string }> {
  if (!isConfigured("r2")) {
    throw new Error(
      "[r2] R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.",
    );
  }
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");
  const bucket = env.R2_BUCKET;

  const { S3Client } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket };
}

/**
 * Upload a buffer or stream to R2. Server-side only.
 * The S3 SDK is dynamic-imported so client bundles never pull it in.
 */
export async function uploadToR2(opts: {
  key: string;
  body: Buffer | Uint8Array | Blob;
  contentType: string;
  cacheControl?: string;
}): Promise<UploadResult> {
  const { client, bucket } = await createR2Client();
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");

  const body =
    opts.body instanceof Blob
      ? new Uint8Array(await opts.body.arrayBuffer())
      : opts.body;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: opts.key,
      Body: body,
      ContentType: opts.contentType,
      CacheControl: opts.cacheControl ?? "public, max-age=31536000, immutable",
    }),
  );

  return {
    key: opts.key,
    publicUrl: resolveR2Url(opts.key),
    contentType: opts.contentType,
    size: body.byteLength,
  };
}

export async function getFromR2(key: string, range?: string) {
  const { client, bucket } = await createR2Client();
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  return client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(range ? { Range: range } : {}),
    }),
  );
}

/** Build a versioned key like `gallery/2026/abc123.webp`. */
export function buildR2Key(prefix: string, filename: string): string {
  const cleanPrefix = prefix.replace(/(^\/|\/$)/g, "");
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const stamp = Date.now().toString(36);
  return `${cleanPrefix}/${stamp}-${safeName}`;
}
