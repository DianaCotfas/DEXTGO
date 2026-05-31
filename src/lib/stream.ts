/**
 * Cloudflare Stream helper — video hosting for hero loops + future content.
 *
 * Stream returns HLS (`.m3u8`) and MP4 URLs and a thumbnail. Hero components
 * use the MP4 fallback for `<video>` autoplay/loop and the thumbnail as the
 * `poster` while loading. We keep the API token server-side; only the public
 * customer subdomain is exposed via NEXT_PUBLIC_CLOUDFLARE_STREAM_BASE.
 */

import { env, isConfigured } from "@/lib/env";

const customerBase = () =>
  env.NEXT_PUBLIC_CLOUDFLARE_STREAM_BASE.replace(/\/$/, "");

export interface StreamSources {
  videoId: string;
  hlsUrl: string;
  mp4Url: string;
  posterUrl: string;
}

const STREAM_VIDEO_ID_RE =
  /\/([a-zA-Z0-9_-]+)\/(?:manifest\/video\.m3u8|downloads\/default\.mp4|thumbnails\/thumbnail\.(?:jpg|jpeg|png))/i;

export function streamSources(videoId: string): StreamSources | null {
  const base = customerBase();
  if (!base || !videoId) return null;
  return {
    videoId,
    hlsUrl: `${base}/${videoId}/manifest/video.m3u8`,
    mp4Url: `${base}/${videoId}/downloads/default.mp4`,
    posterUrl: `${base}/${videoId}/thumbnails/thumbnail.jpg?time=1s&height=1080`,
  };
}

/**
 * Resolve either a Stream UID or known Stream asset URL to all sources.
 */
export function streamSourcesFromReference(reference?: string | null): StreamSources | null {
  if (!reference) return null;
  if (/^https?:\/\//i.test(reference)) {
    const [pathOnly] = reference.split("?");
    const matched = pathOnly.match(STREAM_VIDEO_ID_RE);
    if (!matched?.[1]) return null;
    return streamSources(matched[1]);
  }
  if (reference.includes("/") || reference.includes(".")) return null;
  return streamSources(reference);
}

/**
 * Resolve a hero video reference (either a Stream UID like `abc123` or a full
 * URL) to a usable mp4 URL the <video> tag can autoplay.
 */
export function resolveStreamUrl(reference?: string | null): string | null {
  if (!reference) return null;
  if (/^https?:\/\//.test(reference) && !STREAM_VIDEO_ID_RE.test(reference)) {
    return reference;
  }
  const sources = streamSourcesFromReference(reference);
  return sources?.mp4Url ?? null;
}

export function isStreamConfigured(): boolean {
  return isConfigured("stream");
}
