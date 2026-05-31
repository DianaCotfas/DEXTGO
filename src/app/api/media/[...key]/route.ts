import { NextResponse, type NextRequest } from "next/server";
import { Readable } from "node:stream";
import { getFromR2, verifyMediaSignature } from "@/lib/r2";
import { isConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

interface MediaRouteContext {
  params: Promise<{ key: string[] }>;
}

function parseRangeHeader(value: string | null): string | null {
  if (!value) return null;
  if (!/^bytes=\d*-\d*$/i.test(value.trim())) return null;
  return value.trim();
}

function sanitizeKey(parts: string[]) {
  const joined = parts
    .map((part) => decodeURIComponent(part))
    .join("/")
    .replace(/^\/+/, "");
  if (!joined || joined.includes("..")) return null;
  return joined;
}

export async function GET(request: NextRequest, ctx: MediaRouteContext) {
  if (!isConfigured("r2")) {
    return NextResponse.json(
      { code: "r2-not-configured", message: "R2 is not configured." },
      { status: 503 },
    );
  }

  const { key } = await ctx.params;
  const objectKey = sanitizeKey(key);
  const requestedRange = parseRangeHeader(request.headers.get("range"));
  if (!objectKey) {
    return NextResponse.json({ code: "bad-key" }, { status: 400 });
  }

  const validSignature = verifyMediaSignature(
    objectKey,
    request.nextUrl.searchParams.get("exp"),
    request.nextUrl.searchParams.get("sig"),
  );

  if (!validSignature) {
    // Allow admin preview/edit workflows without signed URL friction.
    const user = await getCurrentUser();
    if (!user?.is_admin) {
      return NextResponse.json({ code: "invalid-signature" }, { status: 401 });
    }
  }

  try {
    const object = await getFromR2(objectKey, requestedRange ?? undefined);
    if (!object.Body) {
      return NextResponse.json({ code: "not-found" }, { status: 404 });
    }

    const body = object.Body as {
      transformToWebStream?: () => ReadableStream;
    } & NodeJS.ReadableStream;
    const stream =
      typeof body.transformToWebStream === "function"
        ? body.transformToWebStream()
        : Readable.toWeb(body as Readable) as ReadableStream;

    const headers = new Headers();
    headers.set("Content-Type", object.ContentType ?? "application/octet-stream");
    headers.set("Cache-Control", object.CacheControl ?? "public, max-age=31536000, immutable");
    headers.set("Accept-Ranges", "bytes");
    if (object.ETag) headers.set("ETag", object.ETag);
    if (object.LastModified) headers.set("Last-Modified", object.LastModified.toUTCString());
    if (object.ContentRange) headers.set("Content-Range", object.ContentRange);
    if (typeof object.ContentLength === "number") {
      headers.set("Content-Length", String(object.ContentLength));
    }

    const status = object.ContentRange ? 206 : 200;

    return new Response(stream, {
      status,
      headers,
    });
  } catch {
    return NextResponse.json({ code: "not-found" }, { status: 404 });
  }
}
